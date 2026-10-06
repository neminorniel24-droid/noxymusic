// Parses every JS file and JSON file and confirms index.html references exist.
const fs=require("fs"),path=require("path"),vm=require("vm");
let bad=0;
