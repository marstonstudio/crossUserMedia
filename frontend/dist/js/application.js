(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/*!
  * Bowser - a browser detector
  * https://github.com/ded/bowser
  * MIT License | (c) Dustin Diaz 2015
  */

!function (name, definition) {
  if (typeof module != 'undefined' && module.exports) module.exports = definition()
  else if (typeof define == 'function' && define.amd) define(definition)
  else this[name] = definition()
}('bowser', function () {
  /**
    * See useragents.js for examples of navigator.userAgent
    */

  var t = true

  function detect(ua) {

    function getFirstMatch(regex) {
      var match = ua.match(regex);
      return (match && match.length > 1 && match[1]) || '';
    }

    function getSecondMatch(regex) {
      var match = ua.match(regex);
      return (match && match.length > 1 && match[2]) || '';
    }

    var iosdevice = getFirstMatch(/(ipod|iphone|ipad)/i).toLowerCase()
      , likeAndroid = /like android/i.test(ua)
      , android = !likeAndroid && /android/i.test(ua)
      , chromeBook = /CrOS/.test(ua)
      , edgeVersion = getFirstMatch(/edge\/(\d+(\.\d+)?)/i)
      , versionIdentifier = getFirstMatch(/version\/(\d+(\.\d+)?)/i)
      , tablet = /tablet/i.test(ua)
      , mobile = !tablet && /[^-]mobi/i.test(ua)
      , result

    if (/opera|opr/i.test(ua)) {
      result = {
        name: 'Opera'
      , opera: t
      , version: versionIdentifier || getFirstMatch(/(?:opera|opr)[\s\/](\d+(\.\d+)?)/i)
      }
    }
    else if (/yabrowser/i.test(ua)) {
      result = {
        name: 'Yandex Browser'
      , yandexbrowser: t
      , version: versionIdentifier || getFirstMatch(/(?:yabrowser)[\s\/](\d+(\.\d+)?)/i)
      }
    }
    else if (/windows phone/i.test(ua)) {
      result = {
        name: 'Windows Phone'
      , windowsphone: t
      }
      if (edgeVersion) {
        result.msedge = t
        result.version = edgeVersion
      }
      else {
        result.msie = t
        result.version = getFirstMatch(/iemobile\/(\d+(\.\d+)?)/i)
      }
    }
    else if (/msie|trident/i.test(ua)) {
      result = {
        name: 'Internet Explorer'
      , msie: t
      , version: getFirstMatch(/(?:msie |rv:)(\d+(\.\d+)?)/i)
      }
    } else if (chromeBook) {
      result = {
        name: 'Chrome'
      , chromeBook: t
      , chrome: t
      , version: getFirstMatch(/(?:chrome|crios|crmo)\/(\d+(\.\d+)?)/i)
      }
    } else if (/chrome.+? edge/i.test(ua)) {
      result = {
        name: 'Microsoft Edge'
      , msedge: t
      , version: edgeVersion
      }
    }
    else if (/chrome|crios|crmo/i.test(ua)) {
      result = {
        name: 'Chrome'
      , chrome: t
      , version: getFirstMatch(/(?:chrome|crios|crmo)\/(\d+(\.\d+)?)/i)
      }
    }
    else if (iosdevice) {
      result = {
        name : iosdevice == 'iphone' ? 'iPhone' : iosdevice == 'ipad' ? 'iPad' : 'iPod'
      }
      // WTF: version is not part of user agent in web apps
      if (versionIdentifier) {
        result.version = versionIdentifier
      }
    }
    else if (/sailfish/i.test(ua)) {
      result = {
        name: 'Sailfish'
      , sailfish: t
      , version: getFirstMatch(/sailfish\s?browser\/(\d+(\.\d+)?)/i)
      }
    }
    else if (/seamonkey\//i.test(ua)) {
      result = {
        name: 'SeaMonkey'
      , seamonkey: t
      , version: getFirstMatch(/seamonkey\/(\d+(\.\d+)?)/i)
      }
    }
    else if (/firefox|iceweasel/i.test(ua)) {
      result = {
        name: 'Firefox'
      , firefox: t
      , version: getFirstMatch(/(?:firefox|iceweasel)[ \/](\d+(\.\d+)?)/i)
      }
      if (/\((mobile|tablet);[^\)]*rv:[\d\.]+\)/i.test(ua)) {
        result.firefoxos = t
      }
    }
    else if (/silk/i.test(ua)) {
      result =  {
        name: 'Amazon Silk'
      , silk: t
      , version : getFirstMatch(/silk\/(\d+(\.\d+)?)/i)
      }
    }
    else if (android) {
      result = {
        name: 'Android'
      , version: versionIdentifier
      }
    }
    else if (/phantom/i.test(ua)) {
      result = {
        name: 'PhantomJS'
      , phantom: t
      , version: getFirstMatch(/phantomjs\/(\d+(\.\d+)?)/i)
      }
    }
    else if (/blackberry|\bbb\d+/i.test(ua) || /rim\stablet/i.test(ua)) {
      result = {
        name: 'BlackBerry'
      , blackberry: t
      , version: versionIdentifier || getFirstMatch(/blackberry[\d]+\/(\d+(\.\d+)?)/i)
      }
    }
    else if (/(web|hpw)os/i.test(ua)) {
      result = {
        name: 'WebOS'
      , webos: t
      , version: versionIdentifier || getFirstMatch(/w(?:eb)?osbrowser\/(\d+(\.\d+)?)/i)
      };
      /touchpad\//i.test(ua) && (result.touchpad = t)
    }
    else if (/bada/i.test(ua)) {
      result = {
        name: 'Bada'
      , bada: t
      , version: getFirstMatch(/dolfin\/(\d+(\.\d+)?)/i)
      };
    }
    else if (/tizen/i.test(ua)) {
      result = {
        name: 'Tizen'
      , tizen: t
      , version: getFirstMatch(/(?:tizen\s?)?browser\/(\d+(\.\d+)?)/i) || versionIdentifier
      };
    }
    else if (/safari/i.test(ua)) {
      result = {
        name: 'Safari'
      , safari: t
      , version: versionIdentifier
      }
    }
    else {
      result = {
        name: getFirstMatch(/^(.*)\/(.*) /),
        version: getSecondMatch(/^(.*)\/(.*) /)
     };
   }

    // set webkit or gecko flag for browsers based on these engines
    if (!result.msedge && /(apple)?webkit/i.test(ua)) {
      result.name = result.name || "Webkit"
      result.webkit = t
      if (!result.version && versionIdentifier) {
        result.version = versionIdentifier
      }
    } else if (!result.opera && /gecko\//i.test(ua)) {
      result.name = result.name || "Gecko"
      result.gecko = t
      result.version = result.version || getFirstMatch(/gecko\/(\d+(\.\d+)?)/i)
    }

    // set OS flags for platforms that have multiple browsers
    if (!result.msedge && (android || result.silk)) {
      result.android = t
    } else if (iosdevice) {
      result[iosdevice] = t
      result.ios = t
    }

    // OS version extraction
    var osVersion = '';
    if (result.windowsphone) {
      osVersion = getFirstMatch(/windows phone (?:os)?\s?(\d+(\.\d+)*)/i);
    } else if (iosdevice) {
      osVersion = getFirstMatch(/os (\d+([_\s]\d+)*) like mac os x/i);
      osVersion = osVersion.replace(/[_\s]/g, '.');
    } else if (android) {
      osVersion = getFirstMatch(/android[ \/-](\d+(\.\d+)*)/i);
    } else if (result.webos) {
      osVersion = getFirstMatch(/(?:web|hpw)os\/(\d+(\.\d+)*)/i);
    } else if (result.blackberry) {
      osVersion = getFirstMatch(/rim\stablet\sos\s(\d+(\.\d+)*)/i);
    } else if (result.bada) {
      osVersion = getFirstMatch(/bada\/(\d+(\.\d+)*)/i);
    } else if (result.tizen) {
      osVersion = getFirstMatch(/tizen[\/\s](\d+(\.\d+)*)/i);
    }
    if (osVersion) {
      result.osversion = osVersion;
    }

    // device type extraction
    var osMajorVersion = osVersion.split('.')[0];
    if (tablet || iosdevice == 'ipad' || (android && (osMajorVersion == 3 || (osMajorVersion == 4 && !mobile))) || result.silk) {
      result.tablet = t
    } else if (mobile || iosdevice == 'iphone' || iosdevice == 'ipod' || android || result.blackberry || result.webos || result.bada) {
      result.mobile = t
    }

    // Graded Browser Support
    // http://developer.yahoo.com/yui/articles/gbs
    if (result.msedge ||
        (result.msie && result.version >= 10) ||
        (result.yandexbrowser && result.version >= 15) ||
        (result.chrome && result.version >= 20) ||
        (result.firefox && result.version >= 20.0) ||
        (result.safari && result.version >= 6) ||
        (result.opera && result.version >= 10.0) ||
        (result.ios && result.osversion && result.osversion.split(".")[0] >= 6) ||
        (result.blackberry && result.version >= 10.1)
        ) {
      result.a = t;
    }
    else if ((result.msie && result.version < 10) ||
        (result.chrome && result.version < 20) ||
        (result.firefox && result.version < 20.0) ||
        (result.safari && result.version < 6) ||
        (result.opera && result.version < 10.0) ||
        (result.ios && result.osversion && result.osversion.split(".")[0] < 6)
        ) {
      result.c = t
    } else result.x = t

    return result
  }

  var bowser = detect(typeof navigator !== 'undefined' ? navigator.userAgent : '')

  bowser.test = function (browserList) {
    for (var i = 0; i < browserList.length; ++i) {
      var browserItem = browserList[i];
      if (typeof browserItem=== 'string') {
        if (browserItem in bowser) {
          return true;
        }
      }
    }
    return false;
  }

  /*
   * Set our detect method to the main bowser object so we can
   * reuse it to test other user agents.
   * This is needed to implement future tests.
   */
  bowser._detect = detect;

  return bowser
});

},{}],2:[function(require,module,exports){
/*!    SWFObject v2.3.20120118 <http://github.com/swfobject/swfobject>
    is released under the MIT License <http://www.opensource.org/licenses/mit-license.php>
*/

(function() {

var create = function(window) {
  var document = window.document;
  var navigator = window.navigator;
  var location = window.location;

  var swfobject = function() {


    var UNDEF = "undefined",
        OBJECT = "object",
        SHOCKWAVE_FLASH = "Shockwave Flash",
        SHOCKWAVE_FLASH_AX = "ShockwaveFlash.ShockwaveFlash",
        FLASH_MIME_TYPE = "application/x-shockwave-flash",
        EXPRESS_INSTALL_ID = "SWFObjectExprInst",
        ON_READY_STATE_CHANGE = "onreadystatechange",

        win = window,
        doc = document,
        nav = navigator,

        plugin = false,
        domLoadFnArr = [],
        regObjArr = [],
        objIdArr = [],
        listenersArr = [],
        storedFbContent,
        storedFbContentId,
        storedCallbackFn,
        storedCallbackObj,
        isDomLoaded = false,
        isExpressInstallActive = false,
        dynamicStylesheet,
        dynamicStylesheetMedia,
        autoHideShow = true,
        encodeURI_enabled = false,

    /* Centralized function for browser feature detection
        - User agent string detection is only used when no good alternative is possible
        - Is executed directly for optimal performance
    */
    ua = function() {
        var w3cdom = typeof doc.getElementById != UNDEF && typeof doc.getElementsByTagName != UNDEF && typeof doc.createElement != UNDEF,
            u = nav.userAgent.toLowerCase(),
            p = nav.platform.toLowerCase(),
            windows = p ? /win/.test(p) : /win/.test(u),
            mac = p ? /mac/.test(p) : /mac/.test(u),
            webkit = /webkit/.test(u) ? parseFloat(u.replace(/^.*webkit\/(\d+(\.\d+)?).*$/, "$1")) : false, // returns either the webkit version or false if not webkit
            ie = nav.appName === "Microsoft Internet Explorer",
            playerVersion = [0,0,0],
            d = null;
        if (typeof nav.plugins != UNDEF && typeof nav.plugins[SHOCKWAVE_FLASH] == OBJECT) {
            d = nav.plugins[SHOCKWAVE_FLASH].description;
            // nav.mimeTypes["application/x-shockwave-flash"].enabledPlugin indicates whether plug-ins are enabled or disabled in Safari 3+
            if (d && (typeof nav.mimeTypes != UNDEF && nav.mimeTypes[FLASH_MIME_TYPE] && nav.mimeTypes[FLASH_MIME_TYPE].enabledPlugin)){
                plugin = true;
                ie = false; // cascaded feature detection for Internet Explorer
                d = d.replace(/^.*\s+(\S+\s+\S+$)/, "$1");
                playerVersion[0] = toInt(d.replace(/^(.*)\..*$/, "$1"));
                playerVersion[1] = toInt(d.replace(/^.*\.(.*)\s.*$/, "$1"));
                playerVersion[2] = /[a-zA-Z]/.test(d) ? toInt(d.replace(/^.*[a-zA-Z]+(.*)$/, "$1")) : 0;
            }
        }
        else if (typeof win.ActiveXObject != UNDEF) {
            try {
                var a = new ActiveXObject(SHOCKWAVE_FLASH_AX);
                if (a) { // a will return null when ActiveX is disabled
                    d = a.GetVariable("$version");
                    if (d) {
                        ie = true; // cascaded feature detection for Internet Explorer
                        d = d.split(" ")[1].split(",");
                        playerVersion = [toInt(d[0]), toInt(d[1]), toInt(d[2])];
                    }
                }
            }
            catch(e) {}
        }
        return { w3:w3cdom, pv:playerVersion, wk:webkit, ie:ie, win:windows, mac:mac };
    }(),

    /* Cross-browser onDomLoad
        - Will fire an event as soon as the DOM of a web page is loaded
        - Internet Explorer workaround based on Diego Perini's solution: http://javascript.nwbox.com/IEContentLoaded/
        - Regular onload serves as fallback
    */
    onDomLoad = function() {
        if (!ua.w3) { return; }
        if ((typeof doc.readyState != UNDEF && doc.readyState == "complete") || (typeof doc.readyState == UNDEF && (doc.getElementsByTagName("body")[0] || doc.body))) { // function is fired after onload, e.g. when script is inserted dynamically
            callDomLoadFunctions();
        }
        if (!isDomLoaded) {
            if (typeof doc.addEventListener != UNDEF) {
                doc.addEventListener("DOMContentLoaded", callDomLoadFunctions, false);
            }
            if (ua.ie) {
                doc.attachEvent(ON_READY_STATE_CHANGE, function detach() {
                    if (doc.readyState == "complete") {
                        doc.detachEvent(ON_READY_STATE_CHANGE, detach);
                        callDomLoadFunctions();
                    }
                });
                if (win == top) { // if not inside an iframe
                    (function checkDomLoadedIE(){
                        if (isDomLoaded) { return; }
                        try {
                            doc.documentElement.doScroll("left");
                        }
                        catch(e) {
                            setTimeout(checkDomLoadedIE, 0);
                            return;
                        }
                        callDomLoadFunctions();
                    }());
                }
            }
            if (ua.wk) {
                (function checkDomLoadedWK(){
                    if (isDomLoaded) { return; }
                    if (!/loaded|complete/.test(doc.readyState)) {
                        setTimeout(checkDomLoadedWK, 0);
                        return;
                    }
                    callDomLoadFunctions();
                }());
            }
        }
    }();

    function callDomLoadFunctions() {
        if (isDomLoaded || !document.getElementsByTagName("body")[0]) { return; }
        try { // test if we can really add/remove elements to/from the DOM; we don't want to fire it too early
            var t, span = createElement("span");
            span.style.display = "none"; //hide the span in case someone has styled spans via CSS
            t = doc.getElementsByTagName("body")[0].appendChild(span);
            t.parentNode.removeChild(t);
            t = null; //clear the variables
            span = null;
        }
        catch (e) { return; }
        isDomLoaded = true;
        var dl = domLoadFnArr.length;
        for (var i = 0; i < dl; i++) {
            domLoadFnArr[i]();
        }
    }

    function addDomLoadEvent(fn) {
        if (isDomLoaded) {
            fn();
        }
        else {
            domLoadFnArr[domLoadFnArr.length] = fn; // Array.push() is only available in IE5.5+
        }
    }

    /* Cross-browser onload
        - Based on James Edwards' solution: http://brothercake.com/site/resources/scripts/onload/
        - Will fire an event as soon as a web page including all of its assets are loaded
     */
    function addLoadEvent(fn) {
        if (typeof win.addEventListener != UNDEF) {
            win.addEventListener("load", fn, false);
        }
        else if (typeof doc.addEventListener != UNDEF) {
            doc.addEventListener("load", fn, false);
        }
        else if (typeof win.attachEvent != UNDEF) {
            addListener(win, "onload", fn);
        }
        else if (typeof win.onload == "function") {
            var fnOld = win.onload;
            win.onload = function() {
                fnOld();
                fn();
            };
        }
        else {
            win.onload = fn;
        }
    }


    /* Detect the Flash Player version for non-Internet Explorer browsers
        - Detecting the plug-in version via the object element is more precise than using the plugins collection item's description:
          a. Both release and build numbers can be detected
          b. Avoid wrong descriptions by corrupt installers provided by Adobe
          c. Avoid wrong descriptions by multiple Flash Player entries in the plugin Array, caused by incorrect browser imports
        - Disadvantage of this method is that it depends on the availability of the DOM, while the plugins collection is immediately available
    */
    function testPlayerVersion() {
        var b = doc.getElementsByTagName("body")[0];
        var o = createElement(OBJECT);
        o.setAttribute("style", "visibility: hidden;");
        o.setAttribute("type", FLASH_MIME_TYPE);
        var t = b.appendChild(o);
        if (t) {
            var counter = 0;
            (function checkGetVariable(){
                if (typeof t.GetVariable != UNDEF) {
                    try {
                        var d = t.GetVariable("$version");
                        if (d) {
                            d = d.split(" ")[1].split(",");
                            ua.pv = [toInt(d[0]), toInt(d[1]), toInt(d[2])];
                        }
                    } catch(e){
                        //t.GetVariable("$version") is known to fail in Flash Player 8 on Firefox
                        //If this error is encountered, assume FP8 or lower. Time to upgrade.
                        ua.pv = [8,0,0];
                    }
                }
                else if (counter < 10) {
                    counter++;
                    setTimeout(checkGetVariable, 10);
                    return;
                }
                b.removeChild(o);
                t = null;
                matchVersions();
            }());
        }
        else {
            matchVersions();
        }
    }

    /* Perform Flash Player and SWF version matching; static publishing only
    */
    function matchVersions() {
        var rl = regObjArr.length;
        if (rl > 0) {
            for (var i = 0; i < rl; i++) { // for each registered object element
                var id = regObjArr[i].id;
                var cb = regObjArr[i].callbackFn;
                var cbObj = {success:false, id:id};
                if (ua.pv[0] > 0) {
                    var obj = getElementById(id);
                    if (obj) {
                        if (hasPlayerVersion(regObjArr[i].swfVersion) && !(ua.wk && ua.wk < 312)) { // Flash Player version >= published SWF version: Houston, we have a match!
                            setVisibility(id, true);
                            if (cb) {
                                cbObj.success = true;
                                cbObj.ref = getObjectById(id);
                                cbObj.id = id;
                                cb(cbObj);
                            }
                        }
                        else if (regObjArr[i].expressInstall && canExpressInstall()) { // show the Adobe Express Install dialog if set by the web page author and if supported
                            var att = {};
                            att.data = regObjArr[i].expressInstall;
                            att.width = obj.getAttribute("width") || "0";
                            att.height = obj.getAttribute("height") || "0";
                            if (obj.getAttribute("class")) { att.styleclass = obj.getAttribute("class"); }
                            if (obj.getAttribute("align")) { att.align = obj.getAttribute("align"); }
                            // parse HTML object param element's name-value pairs
                            var par = {};
                            var p = obj.getElementsByTagName("param");
                            var pl = p.length;
                            for (var j = 0; j < pl; j++) {
                                if (p[j].getAttribute("name").toLowerCase() != "movie") {
                                    par[p[j].getAttribute("name")] = p[j].getAttribute("value");
                                }
                            }
                            showExpressInstall(att, par, id, cb);
                        }
                        else { // Flash Player and SWF version mismatch or an older Webkit engine that ignores the HTML object element's nested param elements: display fallback content instead of SWF
                            displayFbContent(obj);
                            if (cb) { cb(cbObj); }
                        }
                    }
                }
                else {    // if no Flash Player is installed or the fp version cannot be detected we let the HTML object element do its job (either show a SWF or fallback content)
                    setVisibility(id, true);
                    if (cb) {
                        var o = getObjectById(id); // test whether there is an HTML object element or not
                        if (o && typeof o.SetVariable != UNDEF) {
                            cbObj.success = true;
                            cbObj.ref = o;
                            cbObj.id = o.id;
                        }
                        cb(cbObj);
                    }
                }
            }
        }
    }

    /* Main function
        - Will preferably execute onDomLoad, otherwise onload (as a fallback)
    */
    domLoadFnArr[0] = function (){
        if (plugin) {
            testPlayerVersion();
        }
        else {
            matchVersions();
        }
    };

    function getObjectById(objectIdStr) {

        var r = null,
            o = getElementById(objectIdStr);

        if (o && o.nodeName.toUpperCase() === "OBJECT") {

            //If targeted object is valid Flash file
            if (typeof o.SetVariable !== UNDEF){

                r = o;

            } else {

                //If SetVariable is not working on targeted object but a nested object is
                //available, assume classic nested object markup. Return nested object.

                //If SetVariable is not working on targeted object and there is no nested object,
                //return the original object anyway. This is probably new simplified markup.

                r = o.getElementsByTagName(OBJECT)[0] || o;

            }

        }

        return r;

    }

    /* Requirements for Adobe Express Install
        - only one instance can be active at a time
        - fp 6.0.65 or higher
        - Win/Mac OS only
        - no Webkit engines older than version 312
    */
    function canExpressInstall() {
        return !isExpressInstallActive && hasPlayerVersion("6.0.65") && (ua.win || ua.mac) && !(ua.wk && ua.wk < 312);
    }

    /* Show the Adobe Express Install dialog
        - Reference: http://www.adobe.com/cfusion/knowledgebase/index.cfm?id=6a253b75
    */
    function showExpressInstall(att, par, replaceElemIdStr, callbackFn) {

        var obj = getElementById(replaceElemIdStr);

        //Ensure that replaceElemIdStr is really a string and not an element
        replaceElemIdStr = getId(replaceElemIdStr);

        isExpressInstallActive = true;
        storedCallbackFn = callbackFn || null;
        storedCallbackObj = {success:false, id:replaceElemIdStr};

        if (obj) {
            if (obj.nodeName.toUpperCase() == "OBJECT") { // static publishing
                storedFbContent = abstractFbContent(obj);
                storedFbContentId = null;
            }
            else { // dynamic publishing
                storedFbContent = obj;
                storedFbContentId = replaceElemIdStr;
            }
            att.id = EXPRESS_INSTALL_ID;
            if (typeof att.width == UNDEF || (!/%$/.test(att.width) && toInt(att.width) < 310)) { att.width = "310"; }
            if (typeof att.height == UNDEF || (!/%$/.test(att.height) && toInt(att.height) < 137)) { att.height = "137"; }
            doc.title = doc.title.slice(0, 47) + " - Flash Player Installation";
            var pt = ua.ie ? "ActiveX" : "PlugIn",
                fv = "MMredirectURL=" + encodeURIComponent(win.location.toString().replace(/&/g,"%26")) + "&MMplayerType=" + pt + "&MMdoctitle=" + doc.title;
            if (typeof par.flashvars != UNDEF) {
                par.flashvars += "&" + fv;
            }
            else {
                par.flashvars = fv;
            }
            // IE only: when a SWF is loading (AND: not available in cache) wait for the readyState of the object element to become 4 before removing it,
            // because you cannot properly cancel a loading SWF file without breaking browser load references, also obj.onreadystatechange doesn't work
            if (ua.ie && obj.readyState != 4) {
                var newObj = createElement("div");
                replaceElemIdStr += "SWFObjectNew";
                newObj.setAttribute("id", replaceElemIdStr);
                obj.parentNode.insertBefore(newObj, obj); // insert placeholder div that will be replaced by the object element that loads expressinstall.swf
                obj.style.display = "none";
                removeSWF(obj); //removeSWF accepts elements now
            }
            createSWF(att, par, replaceElemIdStr);
        }
    }

    /* Functions to abstract and display fallback content
    */
    function displayFbContent(obj) {
        if (ua.ie && obj.readyState != 4) {
            // IE only: when a SWF is loading (AND: not available in cache) wait for the readyState of the object element to become 4 before removing it,
            // because you cannot properly cancel a loading SWF file without breaking browser load references, also obj.onreadystatechange doesn't work
            obj.style.display = "none";
            var el = createElement("div");
            obj.parentNode.insertBefore(el, obj); // insert placeholder div that will be replaced by the fallback content
            el.parentNode.replaceChild(abstractFbContent(obj), el);
            removeSWF(obj); //removeSWF accepts elements now
        }
        else {
            obj.parentNode.replaceChild(abstractFbContent(obj), obj);
        }
    }

    function abstractFbContent(obj) {
        var ac = createElement("div");
        if (ua.win && ua.ie) {
            ac.innerHTML = obj.innerHTML;
        }
        else {
            var nestedObj = obj.getElementsByTagName(OBJECT)[0];
            if (nestedObj) {
                var c = nestedObj.childNodes;
                if (c) {
                    var cl = c.length;
                    for (var i = 0; i < cl; i++) {
                        if (!(c[i].nodeType == 1 && c[i].nodeName == "PARAM") && !(c[i].nodeType == 8)) {
                            ac.appendChild(c[i].cloneNode(true));
                        }
                    }
                }
            }
        }
        return ac;
    }


    function createIeObject(url, param_str){
        var div = createElement("div");
        div.innerHTML = "<object classid='clsid:D27CDB6E-AE6D-11cf-96B8-444553540000'><param name='movie' value='" +url + "'>" + param_str + "</object>";
        return div.firstChild;
    }

    /* Cross-browser dynamic SWF creation
    */
    function createSWF(attObj, parObj, id) {

        var r, el = getElementById(id);

        id = getId(id); // ensure id is truly an ID and not an element

        if (ua.wk && ua.wk < 312) { return r; }

        if (el) {

            var o = (ua.ie) ? createElement("div") : createElement(OBJECT),
                attr,
                attr_lower,
                param;

            if (typeof attObj.id == UNDEF) { // if no 'id' is defined for the object element, it will inherit the 'id' from the fallback content
                attObj.id = id;
            }

            //Add params
            for (param in parObj) {
                //filter out prototype additions from other potential libraries and IE specific param element
                if (parObj.hasOwnProperty(param) && param.toLowerCase() !== "movie") {
                    createObjParam(o, param, parObj[param]);
                }
            }

            //Create IE object, complete with param nodes
            if(ua.ie){ o = createIeObject(attObj.data, o.innerHTML); }

            //Add attributes to object
            for (attr in attObj) {
                if (attObj.hasOwnProperty(attr)) { // filter out prototype additions from other potential libraries

                    attr_lower = attr.toLowerCase();

                    // 'class' is an ECMA4 reserved keyword
                    if (attr_lower === "styleclass") {
                        o.setAttribute("class", attObj[attr]);
                    } else if (attr_lower !== "classid" && attr_lower !== "data") {
                        o.setAttribute(attr, attObj[attr]);
                    }

                }
            }

            if (ua.ie) {

                objIdArr[objIdArr.length] = attObj.id; // stored to fix object 'leaks' on unload (dynamic publishing only)

            } else {

                o.setAttribute("type", FLASH_MIME_TYPE);
                o.setAttribute("data", attObj.data);

            }

            el.parentNode.replaceChild(o, el);
            r = o;

        }
        return r;
    }


    function createObjParam(el, pName, pValue) {
        var p = createElement("param");
        p.setAttribute("name", pName);
        p.setAttribute("value", pValue);
        el.appendChild(p);
    }

    /* Cross-browser SWF removal
        - Especially needed to safely and completely remove a SWF in Internet Explorer
    */
    function removeSWF(id) {
        var obj = getElementById(id);
        if (obj && obj.nodeName.toUpperCase() == "OBJECT") {
            if (ua.ie) {
                obj.style.display = "none";
                (function removeSWFInIE(){
                    if (obj.readyState == 4) {
						//This step prevents memory leaks in Internet Explorer
			            for (var i in obj) {
			                if (typeof obj[i] == "function") {
			                    obj[i] = null;
			                }
			            }
			            obj.parentNode.removeChild(obj);
                    } else {
                        setTimeout(removeSWFInIE, 10);
                    }
                }());
            }
            else {
                obj.parentNode.removeChild(obj);
            }
        }
    }

    function isElement(id){
        return (id && id.nodeType && id.nodeType === 1);
    }

    function getId(thing){
        return (isElement(thing)) ? thing.id : thing;
    }

    /* Functions to optimize JavaScript compression
    */
    function getElementById(id) {

        //Allow users to pass an element OR an element's ID
        if(isElement(id)){ return id; }

        var el = null;
        try {
            el = doc.getElementById(id);
        }
        catch (e) {}
        return el;
    }

    function createElement(el) {
        return doc.createElement(el);
    }

    //To aid compression; replaces 14 instances of pareseInt with radix
    function toInt(str){
        return parseInt(str, 10);
    }

    /* Updated attachEvent function for Internet Explorer
        - Stores attachEvent information in an Array, so on unload the detachEvent functions can be called to avoid memory leaks
    */
    function addListener(target, eventType, fn) {
        target.attachEvent(eventType, fn);
        listenersArr[listenersArr.length] = [target, eventType, fn];
    }

    /* Flash Player and SWF content version matching
    */
    function hasPlayerVersion(rv) {
        rv += ""; //Coerce number to string, if needed.
        var pv = ua.pv, v = rv.split(".");
        v[0] = toInt(v[0]);
        v[1] = toInt(v[1]) || 0; // supports short notation, e.g. "9" instead of "9.0.0"
        v[2] = toInt(v[2]) || 0;
        return (pv[0] > v[0] || (pv[0] == v[0] && pv[1] > v[1]) || (pv[0] == v[0] && pv[1] == v[1] && pv[2] >= v[2])) ? true : false;
    }

    /* Cross-browser dynamic CSS creation
        - Based on Bobby van der Sluis' solution: http://www.bobbyvandersluis.com/articles/dynamicCSS.php
    */
    function createCSS(sel, decl, media, newStyle) {
        var h = doc.getElementsByTagName("head")[0];
        if (!h) { return; } // to also support badly authored HTML pages that lack a head element
        var m = (typeof media == "string") ? media : "screen";
        if (newStyle) {
            dynamicStylesheet = null;
            dynamicStylesheetMedia = null;
        }
        if (!dynamicStylesheet || dynamicStylesheetMedia != m) {
            // create dynamic stylesheet + get a global reference to it
            var s = createElement("style");
            s.setAttribute("type", "text/css");
            s.setAttribute("media", m);
            dynamicStylesheet = h.appendChild(s);
            if (ua.ie && typeof doc.styleSheets != UNDEF && doc.styleSheets.length > 0) {
                dynamicStylesheet = doc.styleSheets[doc.styleSheets.length - 1];
            }
            dynamicStylesheetMedia = m;
        }
        // add style rule
        if(dynamicStylesheet){
            if (typeof dynamicStylesheet.addRule != UNDEF) {
                dynamicStylesheet.addRule(sel, decl);
            } else if (typeof doc.createTextNode != UNDEF) {
                dynamicStylesheet.appendChild(doc.createTextNode(sel + " {" + decl + "}"));
            }
        }
    }

    function setVisibility(id, isVisible) {
        if (!autoHideShow) { return; }
        var v = isVisible ? "visible" : "hidden",
            el = getElementById(id);
        if (isDomLoaded && el) {
            el.style.visibility = v;
        } else if(typeof id === "string"){
            createCSS("#" + id, "visibility:" + v);
        }
    }

    /* Filter to avoid XSS attacks
    */
    function urlEncodeIfNecessary(s) {
        var regex = /[\\\"<>\.;]/;
        var hasBadChars = regex.exec(s) != null;
        return hasBadChars && typeof encodeURIComponent != UNDEF ? encodeURIComponent(s) : s;
    }

    /* Release memory to avoid memory leaks caused by closures, fix hanging audio/video threads and force open sockets/NetConnections to disconnect (Internet Explorer only)
    */
    var cleanup = function() {
        if (ua.ie) {
            window.attachEvent("onunload", function() {
                // remove listeners to avoid memory leaks
                var ll = listenersArr.length;
                for (var i = 0; i < ll; i++) {
                    listenersArr[i][0].detachEvent(listenersArr[i][1], listenersArr[i][2]);
                }
                // cleanup dynamically embedded objects to fix audio/video threads and force open sockets and NetConnections to disconnect
                var il = objIdArr.length;
                for (var j = 0; j < il; j++) {
                    removeSWF(objIdArr[j]);
                }
                // cleanup library's main closures to avoid memory leaks
                for (var k in ua) {
                    ua[k] = null;
                }
                ua = null;
                for (var l in swfobject) {
                    swfobject[l] = null;
                }
                swfobject = null;
            });
        }
    }();

    return {
        /* Public API
            - Reference: http://code.google.com/p/swfobject/wiki/documentation
        */
        registerObject: function(objectIdStr, swfVersionStr, xiSwfUrlStr, callbackFn) {
            if (ua.w3 && objectIdStr && swfVersionStr) {
                var regObj = {};
                regObj.id = objectIdStr;
                regObj.swfVersion = swfVersionStr;
                regObj.expressInstall = xiSwfUrlStr;
                regObj.callbackFn = callbackFn;
                regObjArr[regObjArr.length] = regObj;
                setVisibility(objectIdStr, false);
            }
            else if (callbackFn) {
                callbackFn({success:false, id:objectIdStr});
            }
        },

        getObjectById: function(objectIdStr) {
            if (ua.w3) {
                return getObjectById(objectIdStr);
            }
        },

        embedSWF: function(swfUrlStr, replaceElemIdStr, widthStr, heightStr, swfVersionStr, xiSwfUrlStr, flashvarsObj, parObj, attObj, callbackFn) {

            var id = getId(replaceElemIdStr),
                callbackObj = {success:false, id:id};

            if (ua.w3 && !(ua.wk && ua.wk < 312) && swfUrlStr && replaceElemIdStr && widthStr && heightStr && swfVersionStr) {
                setVisibility(id, false);
                addDomLoadEvent(function() {
                    widthStr += ""; // auto-convert to string
                    heightStr += "";
                    var att = {};
                    if (attObj && typeof attObj === OBJECT) {
                        for (var i in attObj) { // copy object to avoid the use of references, because web authors often reuse attObj for multiple SWFs
                            att[i] = attObj[i];
                        }
                    }
                    att.data = swfUrlStr;
                    att.width = widthStr;
                    att.height = heightStr;
                    var par = {};
                    if (parObj && typeof parObj === OBJECT) {
                        for (var j in parObj) { // copy object to avoid the use of references, because web authors often reuse parObj for multiple SWFs
                            par[j] = parObj[j];
                        }
                    }
                    if (flashvarsObj && typeof flashvarsObj === OBJECT) {
                        for (var k in flashvarsObj) { // copy object to avoid the use of references, because web authors often reuse flashvarsObj for multiple SWFs
                            if(flashvarsObj.hasOwnProperty(k)){

                                var key = (encodeURI_enabled) ? encodeURIComponent(k) : k,
                                    value = (encodeURI_enabled) ? encodeURIComponent(flashvarsObj[k]) : flashvarsObj[k];

                                if (typeof par.flashvars != UNDEF) {
                                    par.flashvars += "&" + key + "=" + value;
                                }
                                else {
                                    par.flashvars = key + "=" + value;
                                }

                            }
                        }
                    }
                    if (hasPlayerVersion(swfVersionStr)) { // create SWF
                        var obj = createSWF(att, par, replaceElemIdStr);
                        if (att.id == id) {
                            setVisibility(id, true);
                        }
                        callbackObj.success = true;
                        callbackObj.ref = obj;
                        callbackObj.id = obj.id;
                    }
                    else if (xiSwfUrlStr && canExpressInstall()) { // show Adobe Express Install
                        att.data = xiSwfUrlStr;
                        showExpressInstall(att, par, replaceElemIdStr, callbackFn);
                        return;
                    }
                    else { // show fallback content
                        setVisibility(id, true);
                    }
                    if (callbackFn) { callbackFn(callbackObj); }
                });
            }
            else if (callbackFn) { callbackFn(callbackObj);    }
        },

        switchOffAutoHideShow: function() {
            autoHideShow = false;
        },

        enableUriEncoding: function (bool) {
            encodeURI_enabled = (typeof bool === UNDEF) ? true : bool;
        },

        ua: ua,

        getFlashPlayerVersion: function() {
            return { major:ua.pv[0], minor:ua.pv[1], release:ua.pv[2] };
        },

        hasFlashPlayerVersion: hasPlayerVersion,

        createSWF: function(attObj, parObj, replaceElemIdStr) {
            if (ua.w3) {
                return createSWF(attObj, parObj, replaceElemIdStr);
            }
            else {
                return undefined;
            }
        },

        showExpressInstall: function(att, par, replaceElemIdStr, callbackFn) {
            if (ua.w3 && canExpressInstall()) {
                showExpressInstall(att, par, replaceElemIdStr, callbackFn);
            }
        },

        removeSWF: function(objElemIdStr) {
            if (ua.w3) {
                removeSWF(objElemIdStr);
            }
        },

        createCSS: function(selStr, declStr, mediaStr, newStyleBoolean) {
            if (ua.w3) {
                createCSS(selStr, declStr, mediaStr, newStyleBoolean);
            }
        },

        addDomLoadEvent: addDomLoadEvent,

        addLoadEvent: addLoadEvent,

        getQueryParamValue: function(param) {
            var q = doc.location.search || doc.location.hash;
            if (q) {
                if (/\?/.test(q)) { q = q.split("?")[1]; } // strip question mark
                if (param == null) {
                    return urlEncodeIfNecessary(q);
                }
                var pairs = q.split("&");
                for (var i = 0; i < pairs.length; i++) {
                    if (pairs[i].substring(0, pairs[i].indexOf("=")) == param) {
                        return urlEncodeIfNecessary(pairs[i].substring((pairs[i].indexOf("=") + 1)));
                    }
                }
            }
            return "";
        },

        // For internal usage only
        expressInstallCallback: function() {
            if (isExpressInstallActive) {
                var obj = getElementById(EXPRESS_INSTALL_ID);
                if (obj && storedFbContent) {
                    obj.parentNode.replaceChild(storedFbContent, obj);
                    if (storedFbContentId) {
                        setVisibility(storedFbContentId, true);
                        if (ua.ie) { storedFbContent.style.display = "block"; }
                    }
                    if (storedCallbackFn) { storedCallbackFn(storedCallbackObj); }
                }
                isExpressInstallActive = false;
            }
        },

		version: "2.3"

    };
  }();

  return swfobject;
};

if (typeof module !== 'undefined') {
  if (typeof window !== 'undefined') {
    module.exports = create(window);
  }
  module.exports.create = create;
} else {
  this.swfobject = create(window);
}

}());
},{}],3:[function(require,module,exports){
(function (global){
var angular = (typeof window !== "undefined" ? window['angular'] : typeof global !== "undefined" ? global['angular'] : null);
(typeof window !== "undefined" ? window['angular-material'] : typeof global !== "undefined" ? global['angular-material'] : null);

angular.module('Microphone', ['ngMaterial'])

    .config(["$mdThemingProvider", function($mdThemingProvider) {
        $mdThemingProvider.theme('default')
            .primaryPalette('teal')
            .accentPalette('indigo')
            .warnPalette('red')
            .backgroundPalette('grey');
    }])

    .value('bowser', require('bowser'))
    .value('swfEmbedder', require('jakobmattsson-swfobject'))
    .value('encoderjs', (typeof window !== "undefined" ? window['encoderjs'] : typeof global !== "undefined" ? global['encoderjs'] : null))

    .controller('MicrophoneController', [
        '$rootScope',
        '$scope',
        '$log',
        'bowser',
        'NavigatorFactory',
        'FlashRecordingFactory',
        'NativeRecordingFactory',
        'EncoderFactory',
        'UploadFactory',
        require('./controllers/MicrophoneController.js')
    ])

    .directive('swfObject', [
        '$log',
        '$window',
        '$timeout',
        '$interval',
        'swfEmbedder',
        require('./directives/SwfObjectDirective.js')
    ])

    .factory('NavigatorFactory', [
        '$window',
        require('./factories/NavigatorFactory.js')
    ])
    .factory('NativeRecordingFactory', [
        '$rootScope',
        '$log',
        '$q',
        'NavigatorFactory',
        require('./factories/NativeRecordingFactory.js')
    ])
    .factory('FlashRecordingFactory', [
        '$rootScope',
        '$log',
        '$window',
        '$q',
        'swfEmbedder',
        require('./factories/FlashRecordingFactory.js')
    ])
    .factory('EncoderFactory', [
        '$log',
        '$q',
        'encoderjs',
        require('./factories/EncoderFactory.js')
    ])
    .factory('UploadFactory', [
        '$rootScope',
        '$log',
        '$http',
        require('./factories/UploadFactory.js')
    ]);
}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"./controllers/MicrophoneController.js":4,"./directives/SwfObjectDirective.js":5,"./factories/EncoderFactory.js":6,"./factories/FlashRecordingFactory.js":7,"./factories/NativeRecordingFactory.js":8,"./factories/NavigatorFactory.js":9,"./factories/UploadFactory.js":10,"bowser":1,"jakobmattsson-swfobject":2}],4:[function(require,module,exports){
module.exports = function ($rootScope, $scope, $log, bowser, Navigator, FlashRecording, NativeRecording, Encoder, UploadRecording) {
    $log.log('MicrophoneController initialized');

    this.sourceAudioElement = angular.element(document.querySelector('#sourceAudio'));
    this.outputAudioElement = angular.element(document.querySelector('#outputAudio'));

    var self = this;

    Encoder.initialize();

    $scope.microphoneSourceAudioEnabled = !bowser.msie;

    var resetState = function() {
        $scope.microphoneSourceAudioReady = false;
        $scope.microphoneOutputAudioReady = false;
        $scope.microphoneStatus = 'status';
        $scope.microphoneTime = '0.0';
        $scope.microphoneLevel = 0;
        $scope.microphoneFlashVisible = false;
    };

    var getRecordingObject = function () {
        var recordingObject;

        if (Navigator.enabled) {
            recordingObject = NativeRecording;
            $scope.microphoneFlashEnabled = false;
        } else {
            recordingObject = FlashRecording;
            $scope.microphoneFlashEnabled = true;
        }
        return recordingObject;
    };

    (function init() {
        resetState();
        getRecordingObject().initialize();
    })();

    $rootScope.$on('statusEvent', function (event, data) {
        $scope.microphoneStatus = data;
    });

    $rootScope.$on('recordingEvent', function (event, data) {

        if(data) {
            if(data.time && !isNaN(data.time)) {
                $scope.microphoneTime = data.time.toFixed(2);
            }

            if(data.level) {
                if(isNaN(data.level) || data.level < 0) {
                    $scope.microphoneLevel = 0;
                } else {
                    $scope.microphoneLevel = Math.min(data.level, 100);
                }
            }

            refresh();
        }
    });

    $rootScope.$on('flashVisibilityChange', function (event, data) {
        self.setFlashVisible(data);
    });

    this.setFlashVisible = function(data) {
        $scope.microphoneFlashVisible = data;
        if($scope.microphoneFlashVisible) {
            FlashRecording.setFlashVisible(true);
        }
        refresh();
    };

    this.startRecording = function () {
        resetState();
        getRecordingObject().startRecording();
    };

    this.stopRecording = function () {
        $scope.microphoneLevel = 0;

        return getRecordingObject()
            .stopRecording()
            .then(function (pcmObject) {

                return Encoder
                    .process(pcmObject.sampleRate, pcmObject.format, pcmObject.pcmBuffer)
                    .then(function(encodedBlob){

                        $log.log('MicrophoneController encodedBlob.size:' + encodedBlob.size);
                        embedLocalBlob(encodedBlob);

                        return UploadRecording
                            .send(encodedBlob, 'mp4', 'wav')
                            .then(displayProcessedOutput, function(reason) {$log.error(reason);});

                    }, function(reason) {$log.error(reason);});

                /*
                var pcmBlob = new Blob([pcmObject.pcmBuffer], { type: 'audio/L16' });
                return UploadRecording
                    .send(pcmBlob, 'pcm', 'pcm')
                    .then(displayProcessedOutput, function(reason) {$log.error(reason);});
                */

            }, function(reason) {$log.error(reason);});
    };

    this.playSource = function () {
        document.getElementById('sourceAudio').play();
    };

    this.playOutput = function () {
        document.getElementById('outputAudio').play();
    };

    function embedLocalBlob(audioBlob) {
        self.sourceAudioElement.attr('src', URL.createObjectURL(audioBlob));
        $scope.microphoneSourceAudioReady = true;
    }

    function displayProcessedOutput(response) {
        if (response && response.data && response.data.inputUrl) {
            var audioSet = response.data;
            $log.log('received audioSet inputUrl:' + audioSet.inputUrl + ', outputUrl:' + audioSet.outputUrl);

            self.outputAudioElement.attr('src', audioSet.outputUrl);
            $scope.microphoneOutputAudioReady = true;

        } else {
            $log.error('response not in expected json form with inputUrl node');
            $log.error(response);
        }
    }

    function refresh() {
        if ($scope.$root.$$phase !== '$apply' && $scope.$root.$$phase !== '$digest') {
            $scope.$digest();
        }
    }

};
},{}],5:[function(require,module,exports){
// https://github.com/jeef3/angular-swfobject
module.exports = function ($log, $window, $timeout, $interval, swfEmbedder) {

    return {
        restrict: 'EAC',
        template: '<div id="{{id}}" ng-transclude></div>',
        transclude: true,
        scope: {
            isSwfVisible:'@swfVisible',
            vars: '=?swfVars',
            expressInstallSwfurl:'=?xiSwfUrlStr',
            swfLoad: '&'
        },
        link: function link(scope, element, attrs) {

            scope.id = attrs.swfId;
            scope.swfVersion = attrs.swfVersion;

            if(attrs.hasOwnProperty('swfVisible') && attrs.swfVisible !== undefined) {
                if(attrs.swfVisible === 'false') {
                    swfEmbedder.switchOffAutoHideShow();
                }

                scope.$watch('isSwfVisible', function(newvalue, oldvalue){
                    element.css('visibility', (newvalue === 'true') ? 'visible' : 'hidden');
                });
            }

            var attributes = {
                id:scope.id,
                name:scope.id
            };

            var params = {
                bgcolor: attrs.swfBgcolor || '#FFFFFF',
                wmode: attrs.swfWmode || 'window',
                allowscriptaccess: 'always'
            };

            if(swfEmbedder.hasFlashPlayerVersion(scope.swfVersion)) {
                $timeout(function () {
                    swfEmbedder.embedSWF(attrs.swfUrl,
                        scope.id,
                        attrs.swfWidth || 800,
                        attrs.swfHeight || 600,
                        attrs.swfVersion || '10',
                        scope.expressInstallSwfurl,
                        scope.vars,
                        params,
                        attributes,
                        embedHandler);
                }, 0);
            }

            // http://learnswfobject.com/advanced-topics/executing-javascript-when-the-swf-has-finished-loading/
            function swfLoadEvent(evt, fn) {
                //This timeout ensures we don't try to access PercentLoaded too soon
                $timeout(function () {
                    //Ensure Flash Player's PercentLoaded method is available and returns a value
                    if (typeof evt.ref.PercentLoaded !== 'undefined' && evt.ref.PercentLoaded()) {
                        //Set up a timer to periodically check value of PercentLoaded
                        var loadCheckInterval = $interval(function () {
                            //Once value == 100 (fully loaded) we can do whatever we want
                            if (evt.ref.PercentLoaded() === 100) {
                                //Clear interval
                                $interval.cancel(loadCheckInterval);
                                loadCheckInterval = null;
                                //Execute function
                                fn({evt: evt});
                            }
                        }, 1500);
                    }
                }, 200);
            }

            // https://code.google.com/p/swfobject/wiki/api
            function embedHandler(evt) {
                if (scope.swfLoad && typeof(scope.swfLoad) === 'function') {
                    // if failure no reason to go and check if flash is 100% loaded
                    if (!evt.success || !evt.ref) {
                        scope.swfLoad({evt: evt});
                    } else {
                        swfLoadEvent(evt, scope.swfLoad);
                    }
                }

            }

        }
    };
};
},{}],6:[function(require,module,exports){
module.exports = function ($log, $q, encoderjs) {

    var Service = {};

    var initialized = false;
    //var supportTransferableObjects = true;

    Service.initialize = function () {
        if (initialized) {
            return;
        }

        // TODO:unclear if this is necessary, helped sniff out that flash implementation was not sending an actual buffer
        // http://www.html5rocks.com/en/tutorials/workers/basics/
        // https://developers.google.com/web/updates/2011/12/Transferable-Objects-Lightning-Fast?hl=en
        /*
        var blob = new Blob(['onmessage = function(e) {postMessage("worker " + e.data.message);};']);
        var blobUrl = window.URL.createObjectURL(blob);
        var worker = new Worker(blobUrl);

        var uint8Array = new Uint8Array(2);
        uint8Array[0] = 42;
        var arrayBuffer = uint8Array.buffer;
        $log.log('prior arrayBuffer.byteLength: ' + arrayBuffer.byteLength);

        worker.onmessage = function(e) {
            $log.log('callback ' + e.data + ' arrayBuffer.byteLength:' + arrayBuffer.byteLength);
            if(arrayBuffer.byteLength) {
                $log.warn('transferable objects not supported');
                supportTransferableObjects = false;
            } else {
                $log.log('transferable objects supported');
                supportTransferableObjects = true;
            }
            worker.terminate();
        };
        worker.postMessage({'message':'test', 'buffer':arrayBuffer}, [arrayBuffer]);
        */

        initialized = true;
    };

    Service.process = function(sampleRate, format, pcmBuffer) {
        $log.log('EncoderFactory sampleRate:' + sampleRate + ', format:' + format + ', pcmBuffer.byteLength:' + pcmBuffer.byteLength);

        var startTime = new Date();
        var deferred = $q.defer();

        //TODO: figure out a better way to make this reference through browserify to get the javascript properly loaded as a webworker
        //https://github.com/substack/webworkify
        var encoder = new Worker('/js/encoder.js');
        encoder.onmessage = function(e) {
            $log.debug('EncoderFactory listener result in ' + (new Date() - startTime) / 1000 + ' seconds');

            var encodedBuffer = e.data;
            if(encodedBuffer) {
                deferred.resolve(new Blob([encodedBuffer], { type: 'audio/mp4' }));
            } else {
                deferred.reject('EncoderFactory no data received');
            }
        };
        encoder.onerror = function(e) {
            $log.error('EncoderFactory listener error: ' + e.message);
        };

        encoder.postMessage({'inputSampleRate':sampleRate, 'inputFormat':format, 'outputBitrate':'32k', 'pcmBuffer':pcmBuffer}, [pcmBuffer]);

        return deferred.promise;
    };

    return Service;
};

},{}],7:[function(require,module,exports){
module.exports = function ($rootScope, $log, $window, $q, swfEmbedder) {

    var Service = {};
    var recordingDeferred;

    var initialized = false;
    var hasFlashInstalled = false;

    Service.initialize = function () {
        if (initialized) {
            return;
        }

        //functions globally accessible for flash ExternalInterface
        $window.onFlashSoundRecorded = function (sampleRate, audioBase64) {
            var pcmArray = b64toByteArray(audioBase64);
            recordingDeferred.resolve({'sampleRate':sampleRate, 'format':'f32be', 'pcmBuffer':pcmArray.buffer});
        };

        $window.onFlashSoundRecordingError = function (error) {
            recordingDeferred.reject(error);
        };

        $window.onFlashStatusMessage = function(message) {
            $rootScope.$emit('statusEvent', message);
        };

        $window.onFlashRecording = function(time, level) {
            $rootScope.$emit('recordingEvent', {'time':time, 'level':level});
        };

        $window.onFlashVisibilityChange = function(value) {
            $rootScope.$emit('flashVisibilityChange', value);
        };

        hasFlashInstalled = swfEmbedder.getFlashPlayerVersion().major > 0;
        initialized = true;
    };

    Service.setFlashVisible = function (data) {
        if(hasFlashInstalled) {
            getFlashObject().setFlashVisible(data);
        }
    };

    Service.startRecording = function () {
        $log.log('FlashRecordingFactory startRecording');
        if(hasFlashInstalled) {
            getFlashObject().startRecording();
        }
    };

    Service.stopRecording = function () {
        recordingDeferred = $q.defer();
        if(hasFlashInstalled) {
            getFlashObject().stopRecording();
        }
        return recordingDeferred.promise;
    };

    function getFlashObject() {
        return document.getElementById('microphoneSwf');
    }

    // http://stackoverflow.com/questions/16245767/creating-a-blob-from-a-base64-string-in-javascript
    function b64toByteArray(base64Data) {

        var byteCharacters = atob(base64Data);
        var byteNumbers = new Array(byteCharacters.length);
        for (var i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
        }

        return new Uint8Array(byteNumbers);
    }

    return Service;
};
},{}],8:[function(require,module,exports){
module.exports = function($rootScope, $log, $q, Navigator) {

    // http://typedarray.org/from-microphone-to-wav-to-server/

    var monochannel = [];
    var recordingLength = 0;
    var volume = null;
    var sampleRate = null;
    var audioStream = null;
    var context = null;
    var recorder = null;
    var audioInput = null;
    var analyser = null;

    var Service = {};

    Service.initialize = function() {};

    Service.showSettings = function () {
        $log.error('showSettings unimplemented for NativeRecordingFactory');
    };

    Service.startRecording = function() {
        $log.log('NativeRecordingFactory startRecording');
        $rootScope.$emit('statusEvent', 'recording started');

        if (Navigator.enabled) {
            Navigator.getNavigator().getUserMedia({audio: true, video: false}, startUserMediaRecording, function(e) {
                $log.error(e.message);
            });
        }
    };

    Service.stopRecording = function() {
        $rootScope.$emit('statusEvent', 'recording stopped');

        return stopUserMediaRecording();
    };

    function startUserMediaRecording(stream) {
        monochannel.length = 0;
        recordingLength = 0;

        audioStream = stream;

        // creates the audio context
        var audioContext = window.AudioContext || window.webkitAudioContext;
        context = new audioContext();

        // retrieve the current sample rate to be used for WAV packaging
        sampleRate = context.sampleRate;

        // creates an audio node from the microphone incoming stream
        audioInput = context.createMediaStreamSource(audioStream);

        // creates a gain node
        volume = context.createGain();
        audioInput.connect(volume);

        // create an analyzer for volume graph
        //http://www.smartjava.org/content/exploring-html5-web-audio-visualizing-sound
        analyser = context.createAnalyser();
        analyser.smoothingTimeConstant = 0;
        analyser.fftSize = 2048;
        audioInput.connect(analyser);

        /* From the spec: This value controls how frequently the audioprocess event is
         dispatched and how many sample-frames need to be processed each call.
         Lower values for buffer size will result in a lower (better) latency.
         Higher values will be necessary to avoid audio breakup and glitches */
        var bufferSize = 2048;
        recorder = context.createScriptProcessor(bufferSize, 1, 1);

        recorder.onaudioprocess = function(e) {

            var array =  new Uint8Array(analyser.frequencyBinCount);
            analyser.getByteFrequencyData(array);
            var level = getAverageVolume(array);
            //$log.log('onaudioprocess time:' + e.playbackTime + ", level:" + level);
            $rootScope.$emit('recordingEvent', {'time': e.playbackTime, 'level':level});

            //TODO: use AudioBuffer.copyFromChannel()
            //https://developer.mozilla.org/en-US/docs/Web/API/AudioBuffer/copyFromChannel

            var mono = e.inputBuffer.getChannelData(0);
            // we clone the samples
            monochannel.push(new Float32Array(mono));
            recordingLength += bufferSize;
        };

        // we connect the recorder
        volume.connect(recorder);
        recorder.connect(context.destination);
    }

    // https://blogs.windows.com/msedgedev/2015/05/13/announcing-media-capture-functionality-in-microsoft-edge/
    // https://github.com/MicrosoftEdge/Demos/blob/master/webaudiotuner/scripts/demo.js
    function stopUserMediaRecording() {
        var deferred = $q.defer();

        $rootScope.$emit('statusEvent', 'audio saving');

        if (audioInput) {
            audioInput.disconnect();
        }
        if (audioStream && audioStream.active) {
            var audioTracks = audioStream.getAudioTracks();
            if(audioTracks) {
                for (var i = 0; i < audioTracks.length; i++) {
                    audioTracks[i].stop();
                }
            }
        }
        if (recorder) {
            recorder.onaudioprocess = null;
        }

        //flatten all the 2048 length chunks of pcm data into a single Float32Array
        var pcmArray = new Float32Array(recordingLength);
        var offset = 0;
        var chunkCount = monochannel.length;
        for (var c = 0; c < chunkCount; c++) {
            var chunk = monochannel[c];
            pcmArray.set(chunk, offset);
            offset += chunk.length;
        }

        deferred.resolve({'sampleRate':sampleRate, 'format':'f32le', 'pcmBuffer':pcmArray.buffer});
        $rootScope.$emit('statusEvent', 'audio captured');
        return deferred.promise;
    }

    function getAverageVolume(array) {
        var values = 0;
        var average;

        var length = array.length;

        // get all the frequency amplitudes
        for (var i = 0; i < length; i++) {
            values += array[i];
        }

        average = values / length;
        return average;
    }

    return Service;
};
},{}],9:[function(require,module,exports){
module.exports = function($window) {
    var Service = {};
    var navigator = $window.navigator;

    if (!navigator.getUserMedia) {
        navigator.getUserMedia =
            navigator.getUserMedia ||
            navigator.webkitGetUserMedia ||
            navigator.mozGetUserMedia;
    }

    $window.navigator.getUserMedia = navigator.getUserMedia;

    Service.enabled = typeof navigator.getUserMedia === 'function';

    Service.getNavigator = function() {
        return $window.navigator;
    };

    return Service;
};
},{}],10:[function(require,module,exports){
module.exports = function($rootScope, $log, $http) {

    var Service = {};

    Service.send = function(audioBlob, inputFormat, outputFormat) {

        var formData = new FormData();
        formData.append('payload', audioBlob);
        formData.append('inputFormat', inputFormat);
        formData.append('outputFormat', outputFormat);

        //bogus way of setting Content-Type='multipart/form-data'
        //https://uncorkedstudios.com/blog/multipartformdata-file-upload-with-angularjs

        return $http.post(
            '/rest/audio',
            formData,
            { transformRequest: angular.identity, headers: {'Content-Type': undefined} }
        );
    };

    return Service;
};
},{}]},{},[3])


//# sourceMappingURL=application.js.map
