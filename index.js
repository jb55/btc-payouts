
const bip32 = require('bip32')
const bitcoin = require('bitcoinjs-lib')


const table = document.querySelector("table")
var monthStrElem = document.querySelector("#month")
const errmsg = document.querySelector("#errmsg")
var monthInd = 0;
var fromMonth = new Date();

function parseData(d) {
  return d.split("\n")
    .filter(line => !(/^\s*$/.test(line)))
    .map(row => row.split(","))
}

function monthDiff(dateFrom, dateTo) {
  return dateTo.getMonth() - dateFrom.getMonth() + (12 * (dateTo.getFullYear() - dateFrom.getFullYear()))
}

function calcAddress(xpub, row) {
  const node = bip32.fromBase58(xpub)

  const [year,month] = row[0].split("-")
  if (!year || !month)
    throw new Error("invalid date")
  const start = new Date(year, month)
  const ind = monthDiff(start, fromMonth)+1
  const { address } = bitcoin.payments.p2wpkh({
    pubkey: node.derive(ind).publicKey
  })

  return `<tt>${address} #${ind}</tt>`
}

const transforms = {1: calcAddress}
var paidState = {};

function idfn(a) { return a; }

const pseudoCols = 1 // paid?
const cols = ["Paid?", "Start Date", "Address"]

function csvChange(val) {
  var data;
  var i, k, extra=0;
  try {
    data = parseData(val)

    var tablestr = '';

    const nheads = data.reduce((v,row) => Math.max(row.length+pseudoCols,v), cols.length)
    console.log(nheads)

    tablestr += "<thead><tr>"
    for (var h = 0; h < nheads; h++) {
      tablestr += `<th>${cols[h] || ""+(++extra)}</th>`
    }
    tablestr += "</thead></tr>"

    tablestr += "<tbody>"
    for (i = 0; i < data.length; i++) {
      tablestr += "<tr>";
      var row = data[i];
      const rowid = row[1] // xpub
      tablestr += `<td><input id="row-${i}" type="checkbox" onclick="registerPaid(this, '${rowid}')" ${paidState[rowid]?"checked":""}/></td>`
      for (k = 0; k < nheads; k++) {
        const transform = transforms[k] || idfn
        tablestr += `<td>${transform(row[k], row)||""}</td>`
      }
      tablestr += "</tr>"
    }
    tablestr += "</tbody>"
  }
  catch (e) {
    errmsg.innerHTML = `row ${i+1}: ${e.toString()}`
    errmsg.style =""
    return;
  }
  errmsg.style.display = "none";

  table.innerHTML = tablestr;
}

const textarea = document.getElementById("csv")
textarea.oninput = (e) => csvChange(e.target.value)

const monthNames = [
  "January", "February", "March",
  "April", "May", "June", "July",
  "August", "September", "October",
  "November", "December"
];

function updateMonth(n) {
  const now = new Date();
  const omonth = now.getMonth()+n
  const month = omonth % 12;
  const year = now.getFullYear() + Math.floor(omonth/12)
  fromMonth = new Date(year, month);
  const fmt = `${monthNames[month]} ${year}`
  monthStrElem.innerHTML = fmt
  csvChange(textarea.value);
}

window.nextMonth = function nextMonth() {
  updateMonth(++monthInd)
}

window.prevMonth = function prevMonth() {
  updateMonth(--monthInd)
}

window.registerPaid = function registerPaid(e, rowid) {
  paidState[rowid] = e.checked;
  csvChange(textarea.value)
}

updateMonth(0)
csvChange(textarea.value)
