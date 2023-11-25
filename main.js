let elt = document.getElementById('calculator');
let Calc = Desmos.GraphingCalculator(elt);

let graphName = document.getElementById('graphname');
let saveButton = document.getElementById('save-button');
let jsonButton = document.getElementById('json-button');

const editGraphJSON = (state) => {
    let name = graphName.value.trim();
    let newState = {
        expr: state.expressions.list,
    }
    if (name) newState.tle = name;
    return newState;
}

const restoreGraphJSON = (state) => {
    let newState = {
        version: 11,
        randomSeed: "7e22ce48a51bc1451eec62bc6782d4ff",
        graph: {
            viewport: {
                xmin: -10,
                xmax: 10,
            }
        },
        expressions: {
            list: state.expr
        }
    }
    return newState;
}

window.onload = () => {
    let urlParams = new URLSearchParams(window.location.search);
    let rawParam = urlParams.get('d');
    if (rawParam) {
        let decoded = JSON.parse(JSONCrush.uncrush(decodeURIComponent(rawParam)));
        let restoredGraph = restoreGraphJSON(decoded)
        console.log(restoredGraph);
        Calc.setState(restoreGraphJSON(decoded));
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

const getGraphJSON = () => JSON.stringify(Calc.getState(), null, 4);

const setURL = () => {
    let editedJSON = editGraphJSON(Calc.getState());
    let editedJSONString = JSON.stringify(editedJSON);
    let compressedJSONwithURI = encodeURIComponent(JSONCrush.crush(editedJSONString));
    history.pushState({ data: 'data' }, "", `?d=${compressedJSONwithURI}`);
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
