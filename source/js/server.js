(function () {
    var toUnicode = function (str) {
        str = escape(str).replace(/%u/gi, '\\u');
        str = str.replace(/%7b/gi, '{').replace(/%7d/gi, '}').replace(/%3a/gi, ':').replace(/%2c/gi, ',').replace(/%27/gi, '\'').replace(/%22/gi, '"').replace(/%5b/gi, '[').replace(/%5d/gi, ']').replace(/%3D/gi, '=').replace(/%20/gi, ' ').replace(/%3E/gi, '>').replace(/%3C/gi, '<').replace(/%3F/gi, '?');//
        return str;
    }

    var getOS = function () {
        var userAgent = navigator.userAgent.toLowerCase();
        if (userAgent.indexOf("iphone") >= 0) {

            if (Boolean(navigator.userAgent.match(/OS [7-9]_\d[_\d]* like Mac OS X/i))) {
                if (window["WebViewJavascriptBridge"] && WebViewJavascriptBridge.version) {
                    var ver = WebViewJavascriptBridge.version();
                    return "IOS7";
                }
                return "IOS7";
            }
            return "IOS7";

        }

        if (userAgent.indexOf("android") >= 0) {
            /*
            if (userAgent.indexOf("2.3") > 0) {
                window.WebViewJavascriptBridge = new function () {
                    this.send = function (str, callback) {
                        window.location = 'http://WebViewJavascriptBridge:send:' + toUnicode(str) + '◎' + callback
                    }
                }
            }*/
            return "Android"
        }

        /*
        window.WebViewJavascriptBridge = window["WebViewJavascriptBridge"];
        
        if (!window.WebViewJavascriptBridge) {
            window.WebViewJavascriptBridge = new function () {
                this.send = function (str, callback) {
                    var url = 'http://test.eacheteam.cn?WebViewJavascriptBridge:send:' + toUnicode(str) + '&#9678;' + callback;
                    window.location = url;
                }
            }
        }*/
        return "PC"
    }
    var getAndroidVer = function () {
        try {
            var userAgent = navigator.userAgent.toLowerCase();
            var index = userAgent.indexOf("android");
            var end = userAgent.indexOf(";", index);
            var str = userAgent.substring(index + 8, end);
            return "Android-" + (parseInt(str[0]) >= 5 ? 5 : 4).toString();
        }
        catch (e) {
            return "";
        }
    }
    var os = getOS();
    var className = [];
    className.push(os.indexOf("IOS") == 0 ? os.substr(0, 3) : os);
    if (os == "Android") {
        var androidVer = getAndroidVer();
        if (androidVer != "") className.push(androidVer);
    }
    document.documentElement.className = className.join(" ");

    var _bridge;
    var Bridge = new function () {

        var callBackIndex = 0;

        var callbacks = {};
        var id = window["WebViewID"];
        var refreshInv = 0;
        this.send = function (name, data, callback) {
            getBridge(function (b) {

                var _data = {
                    "name": name,
                    "data": data
                };
                switch (os) {
                    case "IOS":
                        b.send(_data, callback);
                        break;
                    case "Android":
                    case "IOS7":
                    case "IOS8":
                    case "PC":
                        if (b == null) {
                            if (callback != null) callback(null);
                            return;
                        }
                        if (callback != null) {
                            callBackIndex = callBackIndex + 1;
                            callbacks[callBackIndex] = callback;

                        }
                        console.log("send:", _data, callBackIndex, id);

                        if (os == "Android") {
                            b.send(JSON.stringify(_data), callback != null ? callBackIndex : -1);
                            return
                        }
                        b.send(JSON.stringify(_data), callback != null ? callBackIndex : -1, id);
                        break
                }
            });
        },
		this.sendBack = function (callBackIndex, data) {
		    console.log("sendBack:" + callBackIndex, data, callbacks[callBackIndex]);

		    var callback = callbacks[callBackIndex];
		    if (callback == null) return;
		    switch (callBackIndex.toString()) {
		        case "-100":
		            clearTimeout(refreshInv);
		            refreshInv = setTimeout(callback, 100, data.result);
		            return;
		        case "-101":
		            if (data.result == "ActionShowNotify") data.result = "";
		            callback(data.result);
		            return;
		        default:
		            delete callbacks[callBackIndex];
		            callback(data.result);
		            return;
		    }
		}
        this.setCallBack = function (id, callback) {
            callbacks[id] = callback;
        }
    }
    window._Bridge = Bridge;
    var onBridgeReady = function (callback) {
        if (_bridge == null) {
            _bridge = window.WebViewJavascriptBridge;
            if (os == "PC" && _bridge == null) {
                console.log("create WebViewJavascriptBridge");
                window.WebViewJavascriptBridge = new function () {
                    this.send = function (str, callback) {
                        var url = 'http://test.eacheteam.cn?WebViewJavascriptBridge:send:' + toUnicode(str) + '&#9678;' + callback;
                        window.location = url;
                    }
                }
                _bridge = window.WebViewJavascriptBridge;
            }

            if (os == "xIOS") {
                _bridge.init(function (message, responseCallback) {
                    var data = Bridge.receive(message.name, message.data);
                    responseCallback(data)
                });
            }
        }
        callback(_bridge)
    }
    var getBridge = function (callback) {

        if (_bridge != null) {
            callback(_bridge);
            return
        }



        if (window.WebViewJavascriptBridge) {
            onBridgeReady(callback)
        } else {

            window.setTimeout(function () {

                onBridgeReady(callback);
            }, 500);

            document.addEventListener('WebViewJavascriptBridgeReady',
			function () {
			    onBridgeReady(callback)
			},
			false);
        }
    }
    window.Bridge = new
	function () {
	    var loadingInv = 0;
	    var loadingTime = 0;
	    var app_id;
	    var tryLogining = false;
	    var tryLoginingTimeOutInv = 0;
	    this.System = null;
	    this.onRefresh = function (callback) {
	        Bridge.setCallBack("-100", callback);
	    }
	    this.setAppID = function (appID) {
	        app_id = appID;
	    }
	    this.tryLogin = function (callback, retry) {
	        if (retry == null) retry = 5;
	        if (retry <= 0) {
	            callback(null);
	            return;
	        }

	        if (tryLogining == true) {
	            clearTimeout(tryLoginingTimeOutInv);
	            tryLoginingTimeOutInv = 0;
	        }

	        var data = null;
	        if (app_id != null) data = { appId: app_id.toString() };

	        tryLogining = true;
	        Bridge.send("tryLogin", data,
			function (data) {
			    if (data == "") {
			        return;
			    }
			    tryLogining = false;
			    clearTimeout(tryLoginingTimeOutInv);
			    tryLoginingTimeOutInv = 0;

			    if (data && data["system"]) {
			        window.Bridge.System = data["system"];
			        console.log("window.Bridge.System", window.Bridge.System);
			        delete data["system"]
			    }
			    callback(data);
			});

	        if (tryLogining == false) return;

	        tryLoginingTimeOutInv = setTimeout(function () {
	            if (tryLogining == true && tryLoginingTimeOutInv > 0) {
	                console.log("timeout:trylogin" + retry);
	                window.Bridge.tryLogin(callback, --retry);
	            }
	        }, 5000);

	    }
	    this.getStorage = function (key, callback) {

	        Bridge.send("getStorage", {
	            key: key
	        },
			callback);
	    }
	    this.setStorage = function (key, value, callback) {
	        Bridge.send("setStorage", {
	            key: key,
	            value: value
	        },
			callback)
	    }
	    this.showLoading = function (text) {
	        clearTimeout(loadingInv);
	        loadingInv = 0;
	        loadingTime = 0;
	        Bridge.send("hideLoading", null, null);
	        loadingInv = setTimeout(function () {
	            if (loadingInv == 0) return;
	            loadingInv = 0;
	            Bridge.send("showLoading", {
	                text: text
	            },
				null);
	            loadingTime = Date.now();
	        },
			1000)
	    }
	    this.hideLoading = function () {
	        var inv = loadingInv;
	        loadingInv = 0;
	        clearTimeout(inv);
	        var time = Math.min(Date.now() - loadingTime, 500);
	        loadingTime = 0;
	        setTimeout(function () {
	            Bridge.send("hideLoading", null, null)
	        },
			time)
	    }
	    this.showUserInfo = function (openid, callback) {
	        Bridge.send("showUserInfo", {
	            openid: openid
	        },
			callback)
	    }
	    this.openMobileWindow = function (url, title, callback) {
	        setTimeout(function () {
	            Bridge.send("openMobileWindow", {
	                url: url,
	                title: title
	            },
                callback)
	        }, 0)

	    }
	    this.closeMobileWindow = function (returnValue) {
	        Bridge.send("closeMobileWindow", returnValue, null)
	    }
	    this.closeAllMobileWindow = function () {
	        Bridge.send("closeAllMobileWindow", null, null)
	    }
	    this.addMobileWindowButton = function (text, callback) {
	        Bridge.send("addMobileWindowButton", {
	            text: text
	        },
			function (data) {
			    var result = callback(data);
			    if (result === false) return;
			    window.Bridge.addMobileWindowButton(text, callback);
			});
	    }
	    this.setMobileWindowTitle = function (title) {
	        Bridge.send("setMobileWindowTitle", {
	            title: title
	        },
			function () { })
	    }
	    this.loginIM = function (id, pass) {
	        Bridge.send("loginIM", {
	            id: id,
	            pass: pass
	        },
			function () { })
	    }
	    this.getOS = function () {
	        return os
	    }
	    this.selectUsers = function (title, limit, structure, callback) {
	        Bridge.send("selectUsers", {
	            title: title,
	            limit: limit,
	            structure: structure
	        },
			callback)
	    }
	    this.createQR = function (url, size, callback) {
	        Bridge.send("createQR", {
	            url: url,
	            size: size
	        },
			callback)
	    }
	    this.addMobileMenu = function (width, title, menus, callback) {
	        var _callback = function (menu) {
	            Bridge.send("bindMobileMenuCallback", {},
				_callback);
	            callback(menu)
	        }
	        Bridge.send("addMobileMenu", {
	            width: width,
	            title: title,
	            menus: menus
	        },
			_callback)
	    }
	    this.setMobileMenuNumber = function (id, number, color) {
	        Bridge.send("setMobileMenuNumber", {
	            id: id,
	            number: number,
	            color: color
	        },
			null)
	    }
	    this.openMobileMenu = function () {
	        Bridge.send("openMobileMenu", {},
			null)
	    }
	    this.closeMobileMenu = function () {
	        Bridge.send("closeMobileMenu", {},
			null)
	    }
	    this.setBadge = function (badge) {
	        Bridge.send("setBadge", { badge: badge }, null)
	    }
	    this.getWebViewVersion = function (callback) {
	        Bridge.send("getWebViewVersion", {}, callback);
	    }
	    this.playAudio = function (file, callback) {
	        Bridge.send("playAudio", { file: file }, callback);
	    }
	    this.uploadAudio = function (callback) {
	        Bridge.send("addAudio", {}, callback);
	    }
	    this.uploadPhoto = function (maxCount, callback) {
	        Bridge.send("addPhoto", { maxCount: maxCount }, callback);
	    }
	    this.uploadFile = function (maxCount, callback) {
	        Bridge.send("addFile", { maxCount: maxCount }, callback);
	    }
	    this.getCloudFileUrl = function (file, callback) {
	        Bridge.send("getCloudFileUrl", { file: file }, function (data) {
	            /*
	            if (filename != null) {
	                if (data.result != "" && data.result != null) data.result = data.result + "&savefilename=" + filename;
	            }*/
	            callback(data);
	        });
	    }
	    this.showCloudFile = function (file) {
	        Bridge.send("showCloudFile", file, null);
	    }
	    this.getVersion = function (callback) {
	        this.getWebViewVersion(function (ver) {
	            if (ver >= "1.2") {
	                //{"os":"IOS","appName":"","appVersion":""}
	                Bridge.send("getVersion", {}, callback);
	                return;
	            }
	            callback(null);
	        });
	    }
	    this.onParam = function (callback) {
	        Bridge.setCallBack("-101", callback);
	        Bridge.send("getParam", {}, null);
	    }
	}

    if (os != "PC") return;

    var caret = new
    function () {
        var properties = ['boxSizing', 'width', 'height', 'overflowX', 'overflowY', 'borderTopWidth', 'borderRightWidth', 'borderBottomWidth', 'borderLeftWidth', 'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft', 'fontStyle', 'fontVariant', 'fontWeight', 'fontStretch', 'fontSize', 'lineHeight', 'fontFamily', 'textAlign', 'textTransform', 'textIndent', 'textDecoration', 'letterSpacing', 'wordSpacing'];
        var isFirefox = !(window.mozInnerScreenX == null);
        var mirrorDivDisplayCheckbox = document.getElementById('mirrorDivDisplay');
        var mirrorDiv, computed, style;
        this.getCaretCoordinates = function (element, position) {
            mirrorDiv = document.getElementById(element.nodeName + '--mirror-div');
            if (!mirrorDiv) {
                mirrorDiv = document.createElement('div');
                mirrorDiv.id = element.nodeName + '--mirror-div';
                document.body.appendChild(mirrorDiv)
            }
            style = mirrorDiv.style;
            computed = getComputedStyle(element);
            style.whiteSpace = 'pre-wrap';
            if (element.nodeName !== 'INPUT') {
                style.wordWrap = 'break-word'
            };
            style.position = 'absolute';
            style.top = element.offsetTop + parseInt(computed.borderTopWidth) + 'px';
            style.left = "0px";
            style.visibility = "hidden";
            properties.forEach(function (prop) {
                style[prop] = computed[prop]
            });
            if (isFirefox) {
                style.width = parseInt(computed.width) - 2 + 'px';
                if (element.scrollHeight > parseInt(computed.height)) {
                    style.overflowY = 'scroll'
                }
            } else {
                style.overflow = 'hidden'
            }
            mirrorDiv.textContent = element.value.substring(0, position);
            if (element.nodeName === 'INPUT') {
                mirrorDiv.textContent = mirrorDiv.textContent.replace(/\s/g, "\u00a0")
            }
            var span = document.createElement('span');
            span.textContent = element.value.substring(position) || '.';
            span.style.backgroundColor = "lightgrey";
            mirrorDiv.appendChild(span);
            var coordinates = {
                top: span.offsetTop + parseInt(computed['borderTopWidth']),
                left: span.offsetLeft + parseInt(computed['borderLeftWidth'])
            };
            return coordinates
        };
        this.getFont = function (element) {
            var computed = getComputedStyle(element);
            return {
                fontFamily: computed["fontFamily"],
                fontSize: computed["font-size"].replace("px", "")
            }
        }
    }(function (window, undefined) {
        'use strict';
        var document = window.document;
        var previousDelegate = window.delegate;
        var isLegacy = !document.addEventListener;
        var addEvtMethod = isLegacy ? 'attachEvent' : 'addEventListener';
        var removeEvtMethod = isLegacy ? 'detachEvent' : 'removeEventListener';
        var domLoadEvt = isLegacy ? 'onreadystatechange' : 'DOMContentLoaded';
        var isFocusinSupported = false;
        var isDOMReady = false;
        var domLoadEvent = {};
        delegate(function (evt) {
            isDOMReady = true;
            domLoadEvent = evt;
            var anchorEl = document.createElement('a');
            anchorEl.href = '#';
            document.body.appendChild(anchorEl);
            anchorEl[addEvtMethod](isLegacy ? 'onfocusin' : 'focusin',
            function () {
                isFocusinSupported = true
            },
            false);
            anchorEl.focus();
            document.body.removeChild(anchorEl)
        });
        var matches = (function () {
            if (!window.Element) return;
            var fns = ['oMatchesSelector', 'msMatchesSelector', 'mozMatchesSelector', 'webkitMatchesSelector', 'matchesSelector', 'matches'];
            for (var i = fns.length; i--;) {
                if (fns[i] in Element.prototype) return fns[i]
            }
        })();
        var processEvtType = function (evtType) {
            evtType = evtType.replace(/^\s+|\s+$/g, '');
            if (isFocusinSupported) {
                if (evtType === 'focus') evtType = 'focusin';
                else if (evtType === 'blur') evtType = 'focusout'
            }
            if (isLegacy) evtType = 'on' + evtType;
            return evtType
        };
        var doCancelReadyState = function (evt) {
            return /in/.test(document.readyState) && /(on)?readystatechange/.test(evt.type)
        };
        var createEvent = function (origEvt) {
            if (isLegacy) origEvt = window.event;
            var evt = {};
            for (var key in origEvt) {
                evt[key] = origEvt[key]
            }
            evt.target = evt.srcElement = evt.target || origEvt.srcElement;
            return evt
        };
        var listenerBody = function (evt, target, selector, listener) {
            if (!selector) {
                listener.call(target, evt);
                return
            }
            if (matches && evt.target[matches]) {
                if (evt.target[matches](selector)) {
                    listener.call(evt.target, evt)
                }
                return
            }
            if (target.querySelectorAll) {
                var els = target.querySelectorAll(selector);
                for (var len = els.length; len--;) {
                    if (evt.target === els[len]) {
                        listener.call(evt.target, evt);
                        break
                    }
                }
            }
        };
        function delegate(target, evtType, selector, listener) {
            if (arguments.length === 1) {
                listener = target;
                if (isDOMReady) {
                    listener.call(document, domLoadEvent);
                    return function () { }
                }
                evtType = domLoadEvt;
                target = document
            } else {
                if (arguments.length === 3) {
                    listener = selector;
                    selector = undefined
                }
                evtType = processEvtType(evtType)
            }
            var listenerProxy = function (evt) {
                evt = createEvent(evt);
                if (doCancelReadyState(evt)) return;
                listenerBody(evt, target, selector, listener);
                if (evtType === domLoadEvt) remove()
            };
            var remove = function () {
                target[removeEvtMethod](evtType, listenerProxy, !!selector)
            };
            target[addEvtMethod](evtType, listenerProxy, !!selector);
            return remove
        };
        delegate.VERSION = '0.2.6';
        if (typeof exports !== 'undefined') {
            if (typeof module !== 'undefined' && module.exports) {
                exports = module.exports = delegate
            }
            exports.delegate = delegate
        } else if (typeof define === 'function' && define.amd) {
            define(function () {
                return delegate
            })
        } else {
            window.delegate = delegate
        }
        delegate.noConflict = function () {
            window.delegate = previousDelegate;
            return delegate
        }
    }(window));
    var sendInputRect = function () {

 

        var _this = this;
        var rect = {};
        var _rect = _this.getBoundingClientRect();
        var left = 0;
        var top = 0;
        if (window.frameElement) {
            var frame = window.frameElement;
            while (frame.frameElement != null)
            {
                frame = frame.frameElement;
            }

            var _this_rect = frame.getBoundingClientRect();
            left = _this_rect.left;
            top = _this_rect.top;
        }

        for (var a in _rect) {
            rect[a] = _rect[a];
        }
       // rect.left += left;
        //rect.top += top;


        rect.font = caret.getFont(_this);
        setTimeout(function () {
            rect.pos = caret.getCaretCoordinates(_this, _this.selectionEnd);
            rect.pos.left += left;
            rect.pos.top += top;

            Bridge.send("sendInputRect", rect, null);
            console.log("getBoundingClientRect", JSON.stringify(rect), left, top);
        },
        0)
    };
    window.addEventListener("load", function () {

    

        delegate(document.body, 'click', 'input[type=text],textarea', sendInputRect);
        delegate(document.body, 'keyup', 'input[type=text],textarea', sendInputRect);
        delegate(document.body, 'scroll', 'input[type=text],textarea', sendInputRect);
    });

    
}());


