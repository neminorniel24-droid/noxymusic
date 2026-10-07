import globals from "globals";
export default [{
 files:["js/**/*.js"],
 languageOptions:{ecmaVersion:"latest",sourceType:"module",globals:{...globals.browser}},
 rules:{"no-undef":"error","no-unused-vars":["error",{args:"none",caughtErrors:"none"}],"no-import-assign":"error","no-redeclare":"error"}
},{
 files:["js/lib/**/*.js"],
 rules:{"no-restricted-imports":["error",{patterns:["../*"]}]}
}];
