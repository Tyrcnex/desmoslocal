// JSONCrush by Frank Force. All credit goes to him. I only converted it to browser JS.
const JSONCrush = {};

JSONCrush.crush = function (string, maxSubstringLength) {
    if (maxSubstringLength === void 0) { maxSubstringLength = 50; }
    var delimiter = '\u0001'; // used to split parts of crushed string
    var JSCrush = function (string, replaceCharacters) {
        // JSCrush Algorithm (repleace repeated substrings with single characters)
        var replaceCharacterPos = replaceCharacters.length;
        var splitString = '';
        var ByteLength = function (string) { return encodeURI(encodeURIComponent(string)).replace(/%../g, 'i').length; };
        var HasUnmatchedSurrogate = function (string) {
            // check ends of string for unmatched surrogate pairs
            var c1 = string.charCodeAt(0);
            var c2 = string.charCodeAt(string.length - 1);
            return (c1 >= 0xDC00 && c1 <= 0xDFFF) || (c2 >= 0xD800 && c2 <= 0xDBFF);
        };
        // count instances of substrings
        var substringCount = {};
        for (var substringLength = 2; substringLength < maxSubstringLength; substringLength++)
            for (var i = 0; i < string.length - substringLength; ++i) {
                var substring = string.substr(i, substringLength);
                // don't recount if already in list
                if (substringCount[substring])
                    continue;
                // prevent breaking up unmatched surrogates
                if (HasUnmatchedSurrogate(substring))
                    continue;
                // count how many times the substring appears
                var count = 1;
                for (var substringPos = string.indexOf(substring, i + substringLength); substringPos >= 0; ++count)
                    substringPos = string.indexOf(substring, substringPos + substringLength);
                // add to list if it appears multiple times
                if (count > 1)
                    substringCount[substring] = count;
            }
        while (true) // loop while string can be crushed more
         {
            // get the next character that is not in the string
            for (; replaceCharacterPos-- && string.includes(replaceCharacters[replaceCharacterPos]);) { }
            if (replaceCharacterPos < 0)
                break; // ran out of replacement characters
            var replaceCharacter = replaceCharacters[replaceCharacterPos];
            // find the longest substring to replace
            var bestSubstring = void 0;
            var bestLengthDelta = 0;
            var replaceByteLength = ByteLength(replaceCharacter);
            for (var substring in substringCount) {
                // calculate change in length of string if it substring was replaced
                var count = substringCount[substring];
                var lengthDelta = (count - 1) * ByteLength(substring) - (count + 1) * replaceByteLength;
                if (!splitString.length)
                    lengthDelta -= ByteLength(delimiter); // include the delimiter length 
                if (lengthDelta <= 0)
                    delete substringCount[substring];
                else if (lengthDelta > bestLengthDelta) {
                    bestSubstring = substring;
                    bestLengthDelta = lengthDelta;
                }
            }
            if (!bestSubstring)
                break; // string can't be compressed further
            // create new string with the split character
            string = string.split(bestSubstring).join(replaceCharacter) + replaceCharacter + bestSubstring;
            splitString = replaceCharacter + splitString;
            // update substring count list after the replacement
            var newSubstringCount = {};
            for (var substring in substringCount) {
                // make a new substring with the replacement
                var newSubstring = substring.split(bestSubstring).join(replaceCharacter);
                // count how many times the new substring appears
                var count = 0;
                for (var i = string.indexOf(newSubstring); i >= 0; ++count)
                    i = string.indexOf(newSubstring, i + newSubstring.length);
                // add to list if it appears multiple times
                if (count > 1)
                    newSubstringCount[newSubstring] = count;
            }
            substringCount = newSubstringCount;
        }
        return { a: string, b: splitString };
    };
    // create a string of replacement characters
    var characters = [];
    // prefer replacing with characters that will not be escaped by encodeURIComponent
    var unescapedCharacters = "-_.!~*'()";
    for (var i = 127; --i;) {
        if ((i >= 48 && i <= 57) || // 0-9
            (i >= 65 && i <= 90) || // A-Z
            (i >= 97 && i <= 122) || // a-z
            unescapedCharacters.includes(String.fromCharCode(i)))
            characters.push(String.fromCharCode(i));
    }
    // pick from extended set last
    for (var i = 32; i < 255; ++i) {
        var c = String.fromCharCode(i);
        if (c != '\\' && !characters.includes(c))
            characters.unshift(c);
    }
    // remove delimiter if it is found in the string
    string = string.replace(new RegExp(delimiter, 'g'), '');
    // swap out common json characters
    string = JSONCrushSwap(string);
    // crush with JS crush
    var crushed = JSCrush(string, characters);
    // insert delimiter between JSCrush parts
    var crushedString = crushed.a;
    if (crushed.b.length)
        crushedString += delimiter + crushed.b;
    // fix issues with some links not being recognized properly
    crushedString += '_';
    // return crushed string
    return crushedString;
};

JSONCrush.uncrush = function (string) {
    // remove last character
    string = string.substring(0, string.length - 1);
    // unsplit the string using the delimiter
    var stringParts = string.split('\u0001');
    // JSUncrush algorithm
    var uncrushedString = stringParts[0];
    if (stringParts.length > 1) {
        var splitString = stringParts[1];
        for (var _i = 0, splitString_1 = splitString; _i < splitString_1.length; _i++) {
            var character = splitString_1[_i];
            // split the string using the current splitCharacter
            var splitArray = uncrushedString.split(character);
            // rejoin the string with the last element from the split
            uncrushedString = splitArray.join(splitArray.pop());
        }
    }
    // unswap the json characters in reverse direction
    return JSONCrushSwap(uncrushedString, 0);
};

var JSONCrushSwap = function (string, forward) {
    if (forward === void 0) { forward = 1; }
    // swap out characters for lesser used ones that wont get escaped
    var swapGroups = [
        ['"', "'"],
        ["':", "!"],
        [",'", "~"],
        ['}', ")", '\\', '\\'],
        ['{', "(", '\\', '\\'],
    ];
    var swapInternal = function (string, g) {
        var regex = new RegExp("".concat((g[2] ? g[2] : '') + g[0], "|").concat((g[3] ? g[3] : '') + g[1]), 'g');
        return string.replace(regex, function ($1) { return ($1 === g[0] ? g[1] : g[0]); });
    };
    // need to be able to swap characters in reverse direction for uncrush
    if (forward)
        for (var i = 0; i < swapGroups.length; ++i)
            string = swapInternal(string, swapGroups[i]);
    else
        for (var i = swapGroups.length; i--;)
            string = swapInternal(string, swapGroups[i]);
    return string;
};
