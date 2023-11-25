let elt = document.getElementById('calculator');
let Calc = Desmos.GraphingCalculator(elt);

let graphName = document.getElementById('graphname');
let saveButton = document.getElementById('save-button');
let jsonButton = document.getElementById('json-button');

window.onload = () => {
    let urlParams = new URLSearchParams(window.location.search);
    let rawParam = urlParams.get('d');
    if (rawParam) {
        let decoded = JSON.parse(JSONCrush.uncrush(decodeURIComponent(rawParam)));
        Calc.setState(decoded);
        if (decoded.tle) graphName.value = decoded.tle;
    }
}

const download = (filename, text) => {
    var element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
    element.setAttribute('download', filename);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
}

const getGraphJSON = (minify) => {
    let state = Calc.getState();
    let name = graphName.value.trim();
    if (name) state.tle = name;
    return minify ? JSONCrush.crush(JSON.stringify(state)) : JSON.stringify(state, null, 4);
}

const setURL = () => {
    let compressedJSON = encodeURIComponent(getGraphJSON(true));
    console.log(decodeURIComponent(compressedJSON));
    history.pushState({ data: 'data' }, "", `?d=${compressedJSON}`);
}

saveButton.onclick = e => {
    let name = graphName.value.trim();
    download(`${name ? name : 'Untitled'}.json`, getGraphJSON());
    setURL();
}

jsonButton.onclick = e => {
    navigator.clipboard.writeText(getGraphJSON()).then(() => {
        setURL();
        alert('Copied JSON!');
    });
}
