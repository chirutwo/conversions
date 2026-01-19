//Get elements
const incDecButton = document.getElementById("incDecButton");
const unitOptions = document.getElementById("units");
const numConvert = document.getElementById("numConversions");
const numConvertDisplay = document.getElementById("numConversionsDisplay");
const outDisplay = document.getElementById("outputDisplay");
const valueIn = document.getElementById("numberin");
const unitIn = document.getElementById("unitin");

var inc = true;
var unitSizes = new Map();
var unitTypes = new Map();
var typeUnits = new Map();
var formalNames = new Map();
var plural = new Map();

let prefixes = [
	'quecto',
	'ronto',
	'yocto',
	'zepto',
	'atto',
	'femto',
	'pico',
	'nano',
	'micro',
	'milli',
	'centi',
	'deci',
	'deca',
	'hecto',
	'kilo',
	'mega',
	'giga',
	'tera',
	'peta',
	'exa',
	'zetta',
	'yotta',
	'ronna',
	'quetta'
];

let SIvalues = [
	1e-30,
	1e-27,
	1e-24,
	1e-21,
	1e-18,
	1e-15,
	1e-12,
	1e-9,
	1e-6,
	1e-3,
	1e-2,
	1e-1,
	10,
	100,
	1000,
	1e6,
	1e9,
	1e12,
	1e15,
	1e18,
	1e21,
	1e24,
	1e27,
	1e30
];

let prefixabbrev = [
	'q',
	'r',
	'y',
	'z',
	'a',
	'f',
	'p',
	'n',
	'μ',
	'm',
	'c',
	'd',
	'da',
	'h',
	'k',
	'M',
	'G',
	'T',
	'P',
	'E',
	'Z',
	'Y',
	'R',
	'Q'
];

//Events
incDecButton.addEventListener("click", () => {
	inc = !inc;
	if (inc) {
		incDecButton.innerText = "increase";
	} else {
		incDecButton.innerText = "decrease";
	}
	//console.log(inc);
	updateResult();
});

function updateResult() {
	numConvertDisplay.innerText = parseInt(numConvert.value) + 1;
	if (unitSizes.has(unitIn.value)) {
		unitIn.classList.remove("error")
		var route = findIncDecRoutes(unitIn.value, parseFloat(valueIn.value), inc, numConvert.value);

		outDisplay.innerHTML = "";
		for (var i = 0; i < route.length; i++) {
			var unit = document.createElement("p");
			unit.classList.add("result");
			unit.innerHTML = 
				route[i][0] + " " + 
				((route[i][0] == 1) ? route[i][1] : plural.get(route[i][1])) + " (<span class=\"" + 
				((route[i][2] >= 0) ? "positive" : "negative") + "\">" +
				((route[i][2] >= 0) ? "+" : "") + route[i][2] + "%</span>)";

			outDisplay.appendChild(unit);

			if ((i + 1) < route.length) {
				var arrowDiv = document.createElement("div");
				arrowDiv.classList.add("centered");

				var arrow = document.createElement("img");
				arrow.src = "imgs/arrow.png";
				arrow.width = 30;
				arrow.classList.add("unitArrow");
				arrowDiv.appendChild(arrow);
				outDisplay.appendChild(arrowDiv);
			}
			//console.log(route[i]);
		}
	} else {
		unitIn.classList.add("error")
	}
}

numConvert.addEventListener("input", updateResult);
valueIn.addEventListener("input", () => {
	if (valueIn.value != "") {
		updateResult();
	}
});
unitIn.addEventListener("input", updateResult);

function convert(a, b, init) {
	let sa = unitSizes.get(a);
	let sb = unitSizes.get(b);

	return init * sa/sb;
}

function utility(x) {
	if (x < 0.5) {
		return 0;
	}
	return Math.round(x)/x;
}

function findIncDecRoutes(init, initValue, inc, length) {
	let initialType = unitTypes.get(init);
	let validConversions = typeUnits.get(initialType);

	let currUnit = formalNames.get(init);
	let currValue = initValue;
	let unitHistory = [[currValue, currUnit, '0.00']];

	//console.log(currUnit, currValue, validConversions, inc, length);

	for (let i = 0; i < length; i++) {
		let bestconversion = currUnit;
		let bestutility = 1;

		for (let j = 0; j < validConversions.length; j++) {
			let newValue = convert(currUnit, validConversions[j], currValue);
			let newutility = utility(newValue);

			if (newutility === 0) continue;

			if ((newutility > bestutility) === inc) {
				bestutility = newutility;
				bestconversion = validConversions[j];
			}
		}

		if (bestutility === 1) break;

		currValue = Math.round(convert(currUnit, bestconversion, currValue));
		currUnit = bestconversion;

		unitHistory.push([currValue, currUnit, (100 * (bestutility - 1)).toFixed(2)]);
	}

	if (currUnit === formalNames.get(init)) return unitHistory;

	currValue = convert(currUnit, formalNames.get(init), currValue);
	let newutility = utility(currValue);

	if (inc) {
		unitHistory.push([Math.round(currValue), formalNames.get(init), (100 * (newutility - 1)).toFixed(2)]);
	} else {
		unitHistory.push([currValue.toFixed(3), formalNames.get(init), '0.00']);
	}

	return unitHistory;
}

//fetch("configs/units.yaml")
fetch("https://raw.githubusercontent.com/ArolaunTech/conversions/main/configs/units.yaml")
	.then(response => response.text())
	.then(text => {
		let units = jsyaml.loadAll(text);
		const numunits = units.length;

		for (let i = 0; i < numunits; i++) {
			for (let j = 0; j < prefixes.length; j++) {
				let abbreviations = [
					prefixes[j] + units[i].abbreviations[0],
					prefixes[j] + units[i].abbreviations[1]
				];

				for (let k = 2; k < units[i].abbreviations.length; k++) {
					abbreviations.push(prefixabbrev[j] + units[i].abbreviations[k]);
				}

				units.push({
					internalNameSingular: prefixes[j] + units[i].internalNameSingular,
					internalNamePlural: prefixes[j] + units[i].internalNamePlural,
					SIconversion: SIvalues[j] * units[i].SIconversion,
					abbreviations: abbreviations,
					unitType: units[i].unitType
				});
			}
		}

		console.log(units);

		for (let i = 0; i < units.length; i++) {
			if (typeUnits.has(units[i].unitType)) {
				typeUnits.get(units[i].unitType).push(units[i].internalNameSingular);
			} else {
				typeUnits.set(units[i].unitType, [units[i].internalNameSingular]);
			}

			unitSizes.set(units[i].internalNameSingular, units[i].SIconversion);
 			unitTypes.set(units[i].internalNameSingular, units[i].unitType);
 			formalNames.set(units[i].internalNameSingular, units[i].internalNameSingular);
 			plural.set(units[i].internalNameSingular, units[i].internalNamePlural);

 			unitSizes.set(units[i].internalNamePlural, units[i].SIconversion);
 			unitTypes.set(units[i].internalNamePlural, units[i].unitType);
 			formalNames.set(units[i].internalNamePlural, units[i].internalNameSingular);
 			plural.set(units[i].internalNamePlural, units[i].internalNamePlural);

 			for (let j = 0; j < units[i].abbreviations.length; j++) {
 				let option = document.createElement('option');
 				option.value = units[i].abbreviations[j];
 				unitOptions.appendChild(option);

 				unitSizes.set(units[i].abbreviations[j], units[i].SIconversion);
 				unitTypes.set(units[i].abbreviations[j], units[i].unitType);
 				formalNames.set(units[i].abbreviations[j], units[i].internalNameSingular);
 				plural.set(units[i].abbreviations[j], units[i].internalNamePlural);
 			}
		}

		updateResult();
	});