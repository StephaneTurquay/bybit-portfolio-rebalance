function countDecimals(number) {
    const string = number.toString();
    const index = string.indexOf('.');
    return index === -1 ? 0 : string.length - index - 1;
}

module.exports = { countDecimals };