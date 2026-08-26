(function () {
  // Back-compat: legacy block referenced upload-by-size.js
  var s = document.createElement("script");
  s.src =
    document.currentScript &&
    document.currentScript.src.replace(/upload-by-size\.js$/, "lgs-launcher.js");
  if (s.src) document.head.appendChild(s);
})();
