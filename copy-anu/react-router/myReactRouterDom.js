// (function (global, factory) {
//     typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
//     typeof define === 'function' && define.amd ? define(['exports'], factory) :
//     (factory((global.History = {})));
//   }(this, (function (exports) { 'use strict';
  
//     function _extends() {
//       _extends = Object.assign || function (target) {
//         for (var i = 1; i < arguments.length; i++) {
//           var source = arguments[i];
  
//           for (var key in source) {
//             if (Object.prototype.hasOwnProperty.call(source, key)) {
//               target[key] = source[key];
//             }
//           }
//         }
  
//         return target;
//       };
  
//       return _extends.apply(this, arguments);
//     }
  
//     function warning(condition, message) {
//       {
//         if (condition) {
//           return;
//         }
  
//         console.warn(message);
//       }
//     }
  
//     var prefix = 'Invariant failed';
//     function invariant(condition, message) {
//       if (condition) {
//         return;
//       }
  
//       {
//         throw new Error(prefix + ": " + (message || ''));
//       }
//     }
  
//     function isAbsolute(pathname) {
//       return pathname.charAt(0) === '/';
//     }
  
//     // About 1.5x faster than the two-arg version of Array#splice()
//     function spliceOne(list, index) {
//       for (var i = index, k = i + 1, n = list.length; k < n; i += 1, k += 1) {
//         list[i] = list[k];
//       }
  
//       list.pop();
//     }
  
//     // This implementation is based heavily on node's url.parse
//     function resolvePathname(to) {
//       var from = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : '';
  
//       var toParts = to && to.split('/') || [];
//       var fromParts = from && from.split('/') || [];
  
//       var isToAbs = to && isAbsolute(to);
//       var isFromAbs = from && isAbsolute(from);
//       var mustEndAbs = isToAbs || isFromAbs;
  
//       if (to && isAbsolute(to)) {
//         // to is absolute
//         fromParts = toParts;
//       } else if (toParts.length) {
//         // to is relative, drop the filename
//         fromParts.pop();
//         fromParts = fromParts.concat(toParts);
//       }
  
//       if (!fromParts.length) return '/';
  
//       var hasTrailingSlash = void 0;
//       if (fromParts.length) {
//         var last = fromParts[fromParts.length - 1];
//         hasTrailingSlash = last === '.' || last === '..' || last === '';
//       } else {
//         hasTrailingSlash = false;
//       }
  
//       var up = 0;
//       for (var i = fromParts.length; i >= 0; i--) {
//         var part = fromParts[i];
  
//         if (part === '.') {
//           spliceOne(fromParts, i);
//         } else if (part === '..') {
//           spliceOne(fromParts, i);
//           up++;
//         } else if (up) {
//           spliceOne(fromParts, i);
//           up--;
//         }
//       }
  
//       if (!mustEndAbs) for (; up--; up) {
//         fromParts.unshift('..');
//       }if (mustEndAbs && fromParts[0] !== '' && (!fromParts[0] || !isAbsolute(fromParts[0]))) fromParts.unshift('');
  
//       var result = fromParts.join('/');
  
//       if (hasTrailingSlash && result.substr(-1) !== '/') result += '/';
  
//       return result;
//     }
  
//     var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };
  
//     function valueEqual(a, b) {
//       if (a === b) return true;
  
//       if (a == null || b == null) return false;
  
//       if (Array.isArray(a)) {
//         return Array.isArray(b) && a.length === b.length && a.every(function (item, index) {
//           return valueEqual(item, b[index]);
//         });
//       }
  
//       var aType = typeof a === 'undefined' ? 'undefined' : _typeof(a);
//       var bType = typeof b === 'undefined' ? 'undefined' : _typeof(b);
  
//       if (aType !== bType) return false;
  
//       if (aType === 'object') {
//         var aValue = a.valueOf();
//         var bValue = b.valueOf();
  
//         if (aValue !== a || bValue !== b) return valueEqual(aValue, bValue);
  
//         var aKeys = Object.keys(a);
//         var bKeys = Object.keys(b);
  
//         if (aKeys.length !== bKeys.length) return false;
  
//         return aKeys.every(function (key) {
//           return valueEqual(a[key], b[key]);
//         });
//       }
  
//       return false;
//     }
  
//     function addLeadingSlash(path) {
//       return path.charAt(0) === "/" ? path : "/" + path;
//     }
//     function stripLeadingSlash(path) {
//       return path.charAt(0) === "/" ? path.substr(1) : path;
//     }
//     function hasBasename(path, prefix) {
//       return new RegExp("^" + prefix + "(\\/|\\?|#|$)", "i").test(path);
//     }
//     function stripBasename(path, prefix) {
//       return hasBasename(path, prefix) ? path.substr(prefix.length) : path;
//     }
//     function stripTrailingSlash(path) {
//       return path.charAt(path.length - 1) === "/" ? path.slice(0, -1) : path;
//     }
//     function parsePath(path) {
//       var pathname = path || "/";
//       var search = "";
//       var hash = "";
//       var hashIndex = pathname.indexOf("#");
  
//       if (hashIndex !== -1) {
//         hash = pathname.substr(hashIndex);
//         pathname = pathname.substr(0, hashIndex);
//       }
  
//       var searchIndex = pathname.indexOf("?");
  
//       if (searchIndex !== -1) {
//         search = pathname.substr(searchIndex);
//         pathname = pathname.substr(0, searchIndex);
//       }
  
//       return {
//         pathname: pathname,
//         search: search === "?" ? "" : search,
//         hash: hash === "#" ? "" : hash
//       };
//     }
//     function createPath(location) {
//       var pathname = location.pathname,
//           search = location.search,
//           hash = location.hash;
//       var path = pathname || "/";
//       if (search && search !== "?") path += search.charAt(0) === "?" ? search : "?" + search;
//       if (hash && hash !== "#") path += hash.charAt(0) === "#" ? hash : "#" + hash;
//       return path;
//     }
  
//     function createLocation(path, state, key, currentLocation) {
//       var location;
  
//       if (typeof path === "string") {
//         // Two-arg form: push(path, state)
//         location = parsePath(path);
//         location.state = state;
//       } else {
//         // One-arg form: push(location)
//         location = _extends({}, path);
//         if (location.pathname === undefined) location.pathname = "";
  
//         if (location.search) {
//           if (location.search.charAt(0) !== "?") location.search = "?" + location.search;
//         } else {
//           location.search = "";
//         }
  
//         if (location.hash) {
//           if (location.hash.charAt(0) !== "#") location.hash = "#" + location.hash;
//         } else {
//           location.hash = "";
//         }
  
//         if (state !== undefined && location.state === undefined) location.state = state;
//       }
  
//       try {
//         location.pathname = decodeURI(location.pathname);
//       } catch (e) {
//         if (e instanceof URIError) {
//           throw new URIError('Pathname "' + location.pathname + '" could not be decoded. ' + "This is likely caused by an invalid percent-encoding.");
//         } else {
//           throw e;
//         }
//       }
  
//       if (key) location.key = key;
  
//       if (currentLocation) {
//         // Resolve incomplete/relative pathname relative to current location.
//         if (!location.pathname) {
//           location.pathname = currentLocation.pathname;
//         } else if (location.pathname.charAt(0) !== "/") {
//           location.pathname = resolvePathname(location.pathname, currentLocation.pathname);
//         }
//       } else {
//         // When there is no prior location and pathname is empty, set it to /
//         if (!location.pathname) {
//           location.pathname = "/";
//         }
//       }
  
//       return location;
//     }
//     function locationsAreEqual(a, b) {
//       return a.pathname === b.pathname && a.search === b.search && a.hash === b.hash && a.key === b.key && valueEqual(a.state, b.state);
//     }
  
//     function createTransitionManager() {
//       var prompt = null;
  
//       function setPrompt(nextPrompt) {
//         warning(prompt == null, "A history supports only one prompt at a time");
//         prompt = nextPrompt;
//         return function () {
//           if (prompt === nextPrompt) prompt = null;
//         };
//       }
  
//       function confirmTransitionTo(location, action, getUserConfirmation, callback) {
//         // TODO: If another transition starts while we're still confirming
//         // the previous one, we may end up in a weird state. Figure out the
//         // best way to handle this.
//         if (prompt != null) {
//           var result = typeof prompt === "function" ? prompt(location, action) : prompt;
  
//           if (typeof result === "string") {
//             if (typeof getUserConfirmation === "function") {
//               getUserConfirmation(result, callback);
//             } else {
//               warning(false, "A history needs a getUserConfirmation function in order to use a prompt message");
//               callback(true);
//             }
//           } else {
//             // Return false from a transition hook to cancel the transition.
//             callback(result !== false);
//           }
//         } else {
//           callback(true);
//         }
//       }
  
//       var listeners = [];
  
//       function appendListener(fn) {
//         var isActive = true;
  
//         function listener() {
//           if (isActive) fn.apply(void 0, arguments);
//         }
  
//         listeners.push(listener);
//         return function () {
//           isActive = false;
//           listeners = listeners.filter(function (item) {
//             return item !== listener;
//           });
//         };
//       }
  
//       function notifyListeners() {
//         for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
//           args[_key] = arguments[_key];
//         }
  
//         listeners.forEach(function (listener) {
//           return listener.apply(void 0, args);
//         });
//       }
  
//       return {
//         setPrompt: setPrompt,
//         confirmTransitionTo: confirmTransitionTo,
//         appendListener: appendListener,
//         notifyListeners: notifyListeners
//       };
//     }
  
//     var canUseDOM = !!(typeof window !== "undefined" && window.document && window.document.createElement);
//     function getConfirmation(message, callback) {
//       callback(window.confirm(message)); // eslint-disable-line no-alert
//     }
//     /**
//      * Returns true if the HTML5 history API is supported. Taken from Modernizr.
//      *
//      * https://github.com/Modernizr/Modernizr/blob/master/LICENSE
//      * https://github.com/Modernizr/Modernizr/blob/master/feature-detects/history.js
//      * changed to avoid false negatives for Windows Phones: https://github.com/reactjs/react-router/issues/586
//      */
  
//     function supportsHistory() {
//       var ua = window.navigator.userAgent;
//       if ((ua.indexOf("Android 2.") !== -1 || ua.indexOf("Android 4.0") !== -1) && ua.indexOf("Mobile Safari") !== -1 && ua.indexOf("Chrome") === -1 && ua.indexOf("Windows Phone") === -1) return false;
//       return window.history && "pushState" in window.history;
//     }
//     /**
//      * Returns true if browser fires popstate on hash change.
//      * IE10 and IE11 do not.
//      */
  
//     function supportsPopStateOnHashChange() {
//       return window.navigator.userAgent.indexOf("Trident") === -1;
//     }
//     /**
//      * Returns false if using go(n) with hash history causes a full page reload.
//      */
  
//     function supportsGoWithoutReloadUsingHash() {
//       return window.navigator.userAgent.indexOf("Firefox") === -1;
//     }
//     /**
//      * Returns true if a given popstate event is an extraneous WebKit event.
//      * Accounts for the fact that Chrome on iOS fires real popstate events
//      * containing undefined state when pressing the back button.
//      */
  
//     function isExtraneousPopstateEvent(event) {
//       event.state === undefined && navigator.userAgent.indexOf("CriOS") === -1;
//     }
  
//     var PopStateEvent = "popstate";
//     var HashChangeEvent = "hashchange";
  
//     function getHistoryState() {
//       try {
//         return window.history.state || {};
//       } catch (e) {
//         // IE 11 sometimes throws when accessing window.history.state
//         // See https://github.com/ReactTraining/history/pull/289
//         return {};
//       }
//     }
//     /**
//      * Creates a history object that uses the HTML5 history API including
//      * pushState, replaceState, and the popstate event.
//      */
  
  
//     function createBrowserHistory(props) {
//       if (props === void 0) {
//         props = {};
//       }
  
//       !canUseDOM ? invariant(false, "Browser history needs a DOM") : void 0;
//       var globalHistory = window.history;
//       var canUseHistory = supportsHistory();
//       var needsHashChangeListener = !supportsPopStateOnHashChange();
//       var _props = props,
//           _props$forceRefresh = _props.forceRefresh,
//           forceRefresh = _props$forceRefresh === void 0 ? false : _props$forceRefresh,
//           _props$getUserConfirm = _props.getUserConfirmation,
//           getUserConfirmation = _props$getUserConfirm === void 0 ? getConfirmation : _props$getUserConfirm,
//           _props$keyLength = _props.keyLength,
//           keyLength = _props$keyLength === void 0 ? 6 : _props$keyLength;
//       var basename = props.basename ? stripTrailingSlash(addLeadingSlash(props.basename)) : "";
  
//       function getDOMLocation(historyState) {
//         var _ref = historyState || {},
//             key = _ref.key,
//             state = _ref.state;
  
//         var _window$location = window.location,
//             pathname = _window$location.pathname,
//             search = _window$location.search,
//             hash = _window$location.hash;
//         var path = pathname + search + hash;
//         warning(!basename || hasBasename(path, basename), "You are attempting to use a basename on a page whose URL path does not begin " + 'with the basename. Expected path "' + path + '" to begin with "' + basename + '".');
//         if (basename) path = stripBasename(path, basename);
//         return createLocation(path, state, key);
//       }
  
//       function createKey() {
//         return Math.random().toString(36).substr(2, keyLength);
//       }
  
//       var transitionManager = createTransitionManager();
  
//       function setState(nextState) {
//         _extends(history, nextState);
  
//         history.length = globalHistory.length;
//         transitionManager.notifyListeners(history.location, history.action);
//       }
  
//       function handlePopState(event) {
//         // Ignore extraneous popstate events in WebKit.
//         if (isExtraneousPopstateEvent(event)) return;
//         handlePop(getDOMLocation(event.state));
//       }
  
//       function handleHashChange() {
//         handlePop(getDOMLocation(getHistoryState()));
//       }
  
//       var forceNextPop = false;
  
//       function handlePop(location) {
//         if (forceNextPop) {
//           forceNextPop = false;
//           setState();
//         } else {
//           var action = "POP";
//           transitionManager.confirmTransitionTo(location, action, getUserConfirmation, function (ok) {
//             if (ok) {
//               setState({
//                 action: action,
//                 location: location
//               });
//             } else {
//               revertPop(location);
//             }
//           });
//         }
//       }
  
//       function revertPop(fromLocation) {
//         var toLocation = history.location; // TODO: We could probably make this more reliable by
//         // keeping a list of keys we've seen in sessionStorage.
//         // Instead, we just default to 0 for keys we don't know.
  
//         var toIndex = allKeys.indexOf(toLocation.key);
//         if (toIndex === -1) toIndex = 0;
//         var fromIndex = allKeys.indexOf(fromLocation.key);
//         if (fromIndex === -1) fromIndex = 0;
//         var delta = toIndex - fromIndex;
  
//         if (delta) {
//           forceNextPop = true;
//           go(delta);
//         }
//       }
  
//       var initialLocation = getDOMLocation(getHistoryState());
//       var allKeys = [initialLocation.key]; // Public interface
  
//       function createHref(location) {
//         return basename + createPath(location);
//       }
  
//       function push(path, state) {
//         warning(!(typeof path === "object" && path.state !== undefined && state !== undefined), "You should avoid providing a 2nd state argument to push when the 1st " + "argument is a location-like object that already has state; it is ignored");
//         var action = "PUSH";
//         var location = createLocation(path, state, createKey(), history.location);
//         transitionManager.confirmTransitionTo(location, action, getUserConfirmation, function (ok) {
//           if (!ok) return;
//           var href = createHref(location);
//           var key = location.key,
//               state = location.state;
  
//           if (canUseHistory) {
//             globalHistory.pushState({
//               key: key,
//               state: state
//             }, null, href);
  
//             if (forceRefresh) {
//               window.location.href = href;
//             } else {
//               var prevIndex = allKeys.indexOf(history.location.key);
//               var nextKeys = allKeys.slice(0, prevIndex === -1 ? 0 : prevIndex + 1);
//               nextKeys.push(location.key);
//               allKeys = nextKeys;
//               setState({
//                 action: action,
//                 location: location
//               });
//             }
//           } else {
//             warning(state === undefined, "Browser history cannot push state in browsers that do not support HTML5 history");
//             window.location.href = href;
//           }
//         });
//       }
  
//       function replace(path, state) {
//         warning(!(typeof path === "object" && path.state !== undefined && state !== undefined), "You should avoid providing a 2nd state argument to replace when the 1st " + "argument is a location-like object that already has state; it is ignored");
//         var action = "REPLACE";
//         var location = createLocation(path, state, createKey(), history.location);
//         transitionManager.confirmTransitionTo(location, action, getUserConfirmation, function (ok) {
//           if (!ok) return;
//           var href = createHref(location);
//           var key = location.key,
//               state = location.state;
  
//           if (canUseHistory) {
//             globalHistory.replaceState({
//               key: key,
//               state: state
//             }, null, href);
  
//             if (forceRefresh) {
//               window.location.replace(href);
//             } else {
//               var prevIndex = allKeys.indexOf(history.location.key);
//               if (prevIndex !== -1) allKeys[prevIndex] = location.key;
//               setState({
//                 action: action,
//                 location: location
//               });
//             }
//           } else {
//             warning(state === undefined, "Browser history cannot replace state in browsers that do not support HTML5 history");
//             window.location.replace(href);
//           }
//         });
//       }
  
//       function go(n) {
//         globalHistory.go(n);
//       }
  
//       function goBack() {
//         go(-1);
//       }
  
//       function goForward() {
//         go(1);
//       }
  
//       var listenerCount = 0;
  
//       function checkDOMListeners(delta) {
//         listenerCount += delta;
  
//         if (listenerCount === 1 && delta === 1) {
//           window.addEventListener(PopStateEvent, handlePopState);
//           if (needsHashChangeListener) window.addEventListener(HashChangeEvent, handleHashChange);
//         } else if (listenerCount === 0) {
//           window.removeEventListener(PopStateEvent, handlePopState);
//           if (needsHashChangeListener) window.removeEventListener(HashChangeEvent, handleHashChange);
//         }
//       }
  
//       var isBlocked = false;
  
//       function block(prompt) {
//         if (prompt === void 0) {
//           prompt = false;
//         }
  
//         var unblock = transitionManager.setPrompt(prompt);
  
//         if (!isBlocked) {
//           checkDOMListeners(1);
//           isBlocked = true;
//         }
  
//         return function () {
//           if (isBlocked) {
//             isBlocked = false;
//             checkDOMListeners(-1);
//           }
  
//           return unblock();
//         };
//       }
  
//       function listen(listener) {
//         var unlisten = transitionManager.appendListener(listener);
//         checkDOMListeners(1);
//         return function () {
//           checkDOMListeners(-1);
//           unlisten();
//         };
//       }
  
//       var history = {
//         length: globalHistory.length,
//         action: "POP",
//         location: initialLocation,
//         createHref: createHref,
//         push: push,
//         replace: replace,
//         go: go,
//         goBack: goBack,
//         goForward: goForward,
//         block: block,
//         listen: listen
//       };
//       return history;
//     }
  
//     var HashChangeEvent$1 = "hashchange";
//     var HashPathCoders = {
//       hashbang: {
//         encodePath: function encodePath(path) {
//           return path.charAt(0) === "!" ? path : "!/" + stripLeadingSlash(path);
//         },
//         decodePath: function decodePath(path) {
//           return path.charAt(0) === "!" ? path.substr(1) : path;
//         }
//       },
//       noslash: {
//         encodePath: stripLeadingSlash,
//         decodePath: addLeadingSlash
//       },
//       slash: {
//         encodePath: addLeadingSlash,
//         decodePath: addLeadingSlash
//       }
//     };
  
//     function getHashPath() {
//       // We can't use window.location.hash here because it's not
//       // consistent across browsers - Firefox will pre-decode it!
//       var href = window.location.href;
//       var hashIndex = href.indexOf("#");
//       return hashIndex === -1 ? "" : href.substring(hashIndex + 1);
//     }
  
//     function pushHashPath(path) {
//       window.location.hash = path;
//     }
  
//     function replaceHashPath(path) {
//       var hashIndex = window.location.href.indexOf("#");
//       window.location.replace(window.location.href.slice(0, hashIndex >= 0 ? hashIndex : 0) + "#" + path);
//     }
  
//     function createHashHistory(props) {
//       if (props === void 0) {
//         props = {};
//       }
  
//       !canUseDOM ? invariant(false, "Hash history needs a DOM") : void 0;
//       var globalHistory = window.history;
//       var canGoWithoutReload = supportsGoWithoutReloadUsingHash();
//       var _props = props,
//           _props$getUserConfirm = _props.getUserConfirmation,
//           getUserConfirmation = _props$getUserConfirm === void 0 ? getConfirmation : _props$getUserConfirm,
//           _props$hashType = _props.hashType,
//           hashType = _props$hashType === void 0 ? "slash" : _props$hashType;
//       var basename = props.basename ? stripTrailingSlash(addLeadingSlash(props.basename)) : "";
//       var _HashPathCoders$hashT = HashPathCoders[hashType],
//           encodePath = _HashPathCoders$hashT.encodePath,
//           decodePath = _HashPathCoders$hashT.decodePath;
  
//       function getDOMLocation() {
//         var path = decodePath(getHashPath());
//         warning(!basename || hasBasename(path, basename), "You are attempting to use a basename on a page whose URL path does not begin " + 'with the basename. Expected path "' + path + '" to begin with "' + basename + '".');
//         if (basename) path = stripBasename(path, basename);
//         return createLocation(path);
//       }
  
//       var transitionManager = createTransitionManager();
  
//       function setState(nextState) {
//         _extends(history, nextState);
  
//         history.length = globalHistory.length;
//         transitionManager.notifyListeners(history.location, history.action);
//       }
  
//       var forceNextPop = false;
//       var ignorePath = null;
  
//       function handleHashChange() {
//         var path = getHashPath();
//         var encodedPath = encodePath(path);
  
//         if (path !== encodedPath) {
//           // Ensure we always have a properly-encoded hash.
//           replaceHashPath(encodedPath);
//         } else {
//           var location = getDOMLocation();
//           var prevLocation = history.location;
//           if (!forceNextPop && locationsAreEqual(prevLocation, location)) return; // A hashchange doesn't always == location change.
  
//           if (ignorePath === createPath(location)) return; // Ignore this change; we already setState in push/replace.
  
//           ignorePath = null;
//           handlePop(location);
//         }
//       }
  
//       function handlePop(location) {
//         if (forceNextPop) {
//           forceNextPop = false;
//           setState();
//         } else {
//           var action = "POP";
//           transitionManager.confirmTransitionTo(location, action, getUserConfirmation, function (ok) {
//             if (ok) {
//               setState({
//                 action: action,
//                 location: location
//               });
//             } else {
//               revertPop(location);
//             }
//           });
//         }
//       }
  
//       function revertPop(fromLocation) {
//         var toLocation = history.location; // TODO: We could probably make this more reliable by
//         // keeping a list of paths we've seen in sessionStorage.
//         // Instead, we just default to 0 for paths we don't know.
  
//         var toIndex = allPaths.lastIndexOf(createPath(toLocation));
//         if (toIndex === -1) toIndex = 0;
//         var fromIndex = allPaths.lastIndexOf(createPath(fromLocation));
//         if (fromIndex === -1) fromIndex = 0;
//         var delta = toIndex - fromIndex;
  
//         if (delta) {
//           forceNextPop = true;
//           go(delta);
//         }
//       } // Ensure the hash is encoded properly before doing anything else.
  
  
//       var path = getHashPath();
//       var encodedPath = encodePath(path);
//       if (path !== encodedPath) replaceHashPath(encodedPath);
//       var initialLocation = getDOMLocation();
//       var allPaths = [createPath(initialLocation)]; // Public interface
  
//       function createHref(location) {
//         return "#" + encodePath(basename + createPath(location));
//       }
  
//       function push(path, state) {
//         warning(state === undefined, "Hash history cannot push state; it is ignored");
//         var action = "PUSH";
//         var location = createLocation(path, undefined, undefined, history.location);
//         transitionManager.confirmTransitionTo(location, action, getUserConfirmation, function (ok) {
//           if (!ok) return;
//           var path = createPath(location);
//           var encodedPath = encodePath(basename + path);
//           var hashChanged = getHashPath() !== encodedPath;
  
//           if (hashChanged) {
//             // We cannot tell if a hashchange was caused by a PUSH, so we'd
//             // rather setState here and ignore the hashchange. The caveat here
//             // is that other hash histories in the page will consider it a POP.
//             ignorePath = path;
//             pushHashPath(encodedPath);
//             var prevIndex = allPaths.lastIndexOf(createPath(history.location));
//             var nextPaths = allPaths.slice(0, prevIndex === -1 ? 0 : prevIndex + 1);
//             nextPaths.push(path);
//             allPaths = nextPaths;
//             setState({
//               action: action,
//               location: location
//             });
//           } else {
//             warning(false, "Hash history cannot PUSH the same path; a new entry will not be added to the history stack");
//             setState();
//           }
//         });
//       }
  
//       function replace(path, state) {
//         warning(state === undefined, "Hash history cannot replace state; it is ignored");
//         var action = "REPLACE";
//         var location = createLocation(path, undefined, undefined, history.location);
//         transitionManager.confirmTransitionTo(location, action, getUserConfirmation, function (ok) {
//           if (!ok) return;
//           var path = createPath(location);
//           var encodedPath = encodePath(basename + path);
//           var hashChanged = getHashPath() !== encodedPath;
  
//           if (hashChanged) {
//             // We cannot tell if a hashchange was caused by a REPLACE, so we'd
//             // rather setState here and ignore the hashchange. The caveat here
//             // is that other hash histories in the page will consider it a POP.
//             ignorePath = path;
//             replaceHashPath(encodedPath);
//           }
  
//           var prevIndex = allPaths.indexOf(createPath(history.location));
//           if (prevIndex !== -1) allPaths[prevIndex] = path;
//           setState({
//             action: action,
//             location: location
//           });
//         });
//       }
  
//       function go(n) {
//         warning(canGoWithoutReload, "Hash history go(n) causes a full page reload in this browser");
//         globalHistory.go(n);
//       }
  
//       function goBack() {
//         go(-1);
//       }
  
//       function goForward() {
//         go(1);
//       }
  
//       var listenerCount = 0;
  
//       function checkDOMListeners(delta) {
//         listenerCount += delta;
  
//         if (listenerCount === 1 && delta === 1) {
//           window.addEventListener(HashChangeEvent$1, handleHashChange);
//         } else if (listenerCount === 0) {
//           window.removeEventListener(HashChangeEvent$1, handleHashChange);
//         }
//       }
  
//       var isBlocked = false;
  
//       function block(prompt) {
//         if (prompt === void 0) {
//           prompt = false;
//         }
  
//         var unblock = transitionManager.setPrompt(prompt);
  
//         if (!isBlocked) {
//           checkDOMListeners(1);
//           isBlocked = true;
//         }
  
//         return function () {
//           if (isBlocked) {
//             isBlocked = false;
//             checkDOMListeners(-1);
//           }
  
//           return unblock();
//         };
//       }
  
//       function listen(listener) {
//         var unlisten = transitionManager.appendListener(listener);
//         checkDOMListeners(1);
//         return function () {
//           checkDOMListeners(-1);
//           unlisten();
//         };
//       }
  
//       var history = {
//         length: globalHistory.length,
//         action: "POP",
//         location: initialLocation,
//         createHref: createHref,
//         push: push,
//         replace: replace,
//         go: go,
//         goBack: goBack,
//         goForward: goForward,
//         block: block,
//         listen: listen
//       };
//       return history;
//     }
  
//     function clamp(n, lowerBound, upperBound) {
//       return Math.min(Math.max(n, lowerBound), upperBound);
//     }
//     /**
//      * Creates a history object that stores locations in memory.
//      */
  
  
//     function createMemoryHistory(props) {
//       if (props === void 0) {
//         props = {};
//       }
  
//       var _props = props,
//           getUserConfirmation = _props.getUserConfirmation,
//           _props$initialEntries = _props.initialEntries,
//           initialEntries = _props$initialEntries === void 0 ? ["/"] : _props$initialEntries,
//           _props$initialIndex = _props.initialIndex,
//           initialIndex = _props$initialIndex === void 0 ? 0 : _props$initialIndex,
//           _props$keyLength = _props.keyLength,
//           keyLength = _props$keyLength === void 0 ? 6 : _props$keyLength;
//       var transitionManager = createTransitionManager();
  
//       function setState(nextState) {
//         _extends(history, nextState);
  
//         history.length = history.entries.length;
//         transitionManager.notifyListeners(history.location, history.action);
//       }
  
//       function createKey() {
//         return Math.random().toString(36).substr(2, keyLength);
//       }
  
//       var index = clamp(initialIndex, 0, initialEntries.length - 1);
//       var entries = initialEntries.map(function (entry) {
//         return typeof entry === "string" ? createLocation(entry, undefined, createKey()) : createLocation(entry, undefined, entry.key || createKey());
//       }); // Public interface
  
//       var createHref = createPath;
  
//       function push(path, state) {
//         warning(!(typeof path === "object" && path.state !== undefined && state !== undefined), "You should avoid providing a 2nd state argument to push when the 1st " + "argument is a location-like object that already has state; it is ignored");
//         var action = "PUSH";
//         var location = createLocation(path, state, createKey(), history.location);
//         transitionManager.confirmTransitionTo(location, action, getUserConfirmation, function (ok) {
//           if (!ok) return;
//           var prevIndex = history.index;
//           var nextIndex = prevIndex + 1;
//           var nextEntries = history.entries.slice(0);
  
//           if (nextEntries.length > nextIndex) {
//             nextEntries.splice(nextIndex, nextEntries.length - nextIndex, location);
//           } else {
//             nextEntries.push(location);
//           }
  
//           setState({
//             action: action,
//             location: location,
//             index: nextIndex,
//             entries: nextEntries
//           });
//         });
//       }
  
//       function replace(path, state) {
//         warning(!(typeof path === "object" && path.state !== undefined && state !== undefined), "You should avoid providing a 2nd state argument to replace when the 1st " + "argument is a location-like object that already has state; it is ignored");
//         var action = "REPLACE";
//         var location = createLocation(path, state, createKey(), history.location);
//         transitionManager.confirmTransitionTo(location, action, getUserConfirmation, function (ok) {
//           if (!ok) return;
//           history.entries[history.index] = location;
//           setState({
//             action: action,
//             location: location
//           });
//         });
//       }
  
//       function go(n) {
//         var nextIndex = clamp(history.index + n, 0, history.entries.length - 1);
//         var action = "POP";
//         var location = history.entries[nextIndex];
//         transitionManager.confirmTransitionTo(location, action, getUserConfirmation, function (ok) {
//           if (ok) {
//             setState({
//               action: action,
//               location: location,
//               index: nextIndex
//             });
//           } else {
//             // Mimic the behavior of DOM histories by
//             // causing a render after a cancelled POP.
//             setState();
//           }
//         });
//       }
  
//       function goBack() {
//         go(-1);
//       }
  
//       function goForward() {
//         go(1);
//       }
  
//       function canGo(n) {
//         var nextIndex = history.index + n;
//         return nextIndex >= 0 && nextIndex < history.entries.length;
//       }
  
//       function block(prompt) {
//         if (prompt === void 0) {
//           prompt = false;
//         }
  
//         return transitionManager.setPrompt(prompt);
//       }
  
//       function listen(listener) {
//         return transitionManager.appendListener(listener);
//       }
  
//       var history = {
//         length: entries.length,
//         action: "POP",
//         location: entries[index],
//         index: index,
//         entries: entries,
//         createHref: createHref,
//         push: push,
//         replace: replace,
//         go: go,
//         goBack: goBack,
//         goForward: goForward,
//         canGo: canGo,
//         block: block,
//         listen: listen
//       };
//       return history;
//     }
  
//     exports.createBrowserHistory = createBrowserHistory;
//     exports.createHashHistory = createHashHistory;
//     exports.createMemoryHistory = createMemoryHistory;
//     exports.createLocation = createLocation;
//     exports.locationsAreEqual = locationsAreEqual;
//     exports.parsePath = parsePath;
//     exports.createPath = createPath;
  
//     Object.defineProperty(exports, '__esModule', { value: true });
  
// })));

/*=============================================================/History=============================================*/
var DEFAULT_DELIMITER = '/'
var DEFAULT_DELIMITERS = './'

/**
 * The main path matching regexp utility.
 *
 * @type {RegExp}
 */
var PATH_REGEXP = new RegExp([
    // Match escaped characters that would otherwise appear in future matches.
    // This allows the user to escape special characters that won't transform.
    '(\\\\.)',
    // Match Express-style parameters and un-named parameters with a prefix
    // and optional suffixes. Matches appear as:
    //
    // ":test(\\d+)?" => ["test", "\d+", undefined, "?"]
    // "(\\d+)"  => [undefined, undefined, "\d+", undefined]
    '(?:\\:(\\w+)(?:\\(((?:\\\\.|[^\\\\()])+)\\))?|\\(((?:\\\\.|[^\\\\()])+)\\))([+*?])?'
].join('|'), 'g')

/**
 * Parse a string for the raw tokens.
 *
 * @param  {string}  str
 * @param  {Object=} options
 * @return {!Array}
 */
function parse(str, options) {
    var tokens = []
    var key = 0
    var index = 0
    var path = ''
    var defaultDelimiter = (options && options.delimiter) || DEFAULT_DELIMITER
    var delimiters = (options && options.delimiters) || DEFAULT_DELIMITERS
    var pathEscaped = false
    var res

    while ((res = PATH_REGEXP.exec(str)) !== null) {
        var m = res[0]
        var escaped = res[1]
        var offset = res.index
        path += str.slice(index, offset)
        index = offset + m.length

        // Ignore already escaped sequences.
        if (escaped) {
            path += escaped[1]
            pathEscaped = true
            continue
        }

        var prev = ''
        var next = str[index]
        var name = res[2]
        var capture = res[3]
        var group = res[4]
        var modifier = res[5]

        if (!pathEscaped && path.length) {
            var k = path.length - 1

            if (delimiters.indexOf(path[k]) > -1) {
                prev = path[k]
                path = path.slice(0, k)
            }
        }

        // Push the current path onto the tokens.
        if (path) {
            tokens.push(path)
            path = ''
            pathEscaped = false
        }

        var partial = prev !== '' && next !== undefined && next !== prev
        var repeat = modifier === '+' || modifier === '*'
        var optional = modifier === '?' || modifier === '*'
        var delimiter = prev || defaultDelimiter
        var pattern = capture || group

        tokens.push({
            name: name || key++,
            prefix: prev,
            delimiter: delimiter,
            optional: optional,
            repeat: repeat,
            partial: partial,
            pattern: pattern ? escapeGroup(pattern) : '[^' + escapeString(delimiter) + ']+?'
        })
    }

    // Push any remaining characters.
    if (path || index < str.length) {
        tokens.push(path + str.substr(index))
    }

    return tokens
}

/**
 * Compile a string to a template function for the path.
 *
 * @param  {string}             str
 * @param  {Object=}            options
 * @return {!function(Object=, Object=)}
 */
function compile(str, options) {
    return tokensToFunction(parse(str, options))
}

/**
 * Expose a method for transforming tokens into the path function.
 */
function tokensToFunction(tokens) {
    // Compile all the tokens into regexps.
    var matches = new Array(tokens.length)

    // Compile all the patterns before compilation.
    for (var i = 0; i < tokens.length; i++) {
        if (typeof tokens[i] === 'object') {
            matches[i] = new RegExp('^(?:' + tokens[i].pattern + ')$')
        }
    }

    return function (data, options) {
        var path = ''
        var encode = (options && options.encode) || encodeURIComponent

        for (var i = 0; i < tokens.length; i++) {
            var token = tokens[i]

            if (typeof token === 'string') {
                path += token
                continue
            }

            var value = data ? data[token.name] : undefined
            var segment

            if (Array.isArray(value)) {
                if (!token.repeat) {
                    throw new TypeError('Expected "' + token.name + '" to not repeat, but got array')
                }

                if (value.length === 0) {
                    if (token.optional) continue

                    throw new TypeError('Expected "' + token.name + '" to not be empty')
                }

                for (var j = 0; j < value.length; j++) {
                    segment = encode(value[j], token)

                    if (!matches[i].test(segment)) {
                        throw new TypeError('Expected all "' + token.name + '" to match "' + token.pattern + '"')
                    }

                    path += (j === 0 ? token.prefix : token.delimiter) + segment
                }

                continue
            }

            if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
                segment = encode(String(value), token)

                if (!matches[i].test(segment)) {
                    throw new TypeError('Expected "' + token.name + '" to match "' + token.pattern + '", but got "' + segment + '"')
                }

                path += token.prefix + segment
                continue
            }

            if (token.optional) {
                // Prepend partial segment prefixes.
                if (token.partial) path += token.prefix

                continue
            }

            throw new TypeError('Expected "' + token.name + '" to be ' + (token.repeat ? 'an array' : 'a string'))
        }

        return path
    }
}

/**
 * Escape a regular expression string.
 *
 * @param  {string} str
 * @return {string}
 */
function escapeString(str) {
    return str.replace(/([.+*?=^!:${}()[\]|/\\])/g, '\\$1')
}

/**
 * Escape the capturing group by escaping special characters and meaning.
 *
 * @param  {string} group
 * @return {string}
 */
function escapeGroup(group) {
    return group.replace(/([=!:$/()])/g, '\\$1')
}

/**
 * Get the flags for a regexp from the options.
 *
 * @param  {Object} options
 * @return {string}
 */
function flags(options) {
    return options && options.sensitive ? '' : 'i'
}

/**
 * Pull out keys from a regexp.
 *
 * @param  {!RegExp} path
 * @param  {Array=}  keys
 * @return {!RegExp}
 */
function regexpToRegexp(path, keys) {
    if (!keys) return path

    // Use a negative lookahead to match only capturing groups.
    var groups = path.source.match(/\((?!\?)/g)

    if (groups) {
        for (var i = 0; i < groups.length; i++) {
            keys.push({
                name: i,
                prefix: null,
                delimiter: null,
                optional: false,
                repeat: false,
                partial: false,
                pattern: null
            })
        }
    }

    return path
}

/**
 * Transform an array into a regexp.
 *
 * @param  {!Array}  path
 * @param  {Array=}  keys
 * @param  {Object=} options
 * @return {!RegExp}
 */
function arrayToRegexp(path, keys, options) {
    var parts = []

    for (var i = 0; i < path.length; i++) {
        parts.push(pathToRegexp(path[i], keys, options).source)
    }

    return new RegExp('(?:' + parts.join('|') + ')', flags(options))
}

/**
 * Create a path regexp from string input.
 *
 * @param  {string}  path
 * @param  {Array=}  keys
 * @param  {Object=} options
 * @return {!RegExp}
 */
function stringToRegexp(path, keys, options) {
    return tokensToRegExp(parse(path, options), keys, options)
}

/**
 * Expose a function for taking tokens and returning a RegExp.
 *
 * @param  {!Array}  tokens
 * @param  {Array=}  keys
 * @param  {Object=} options
 * @return {!RegExp}
 */
function tokensToRegExp(tokens, keys, options) {
    options = options || {}

    var strict = options.strict
    var start = options.start !== false
    var end = options.end !== false
    var delimiter = escapeString(options.delimiter || DEFAULT_DELIMITER)
    var delimiters = options.delimiters || DEFAULT_DELIMITERS
    var endsWith = [].concat(options.endsWith || []).map(escapeString).concat('$').join('|')
    var route = start ? '^' : ''
    var isEndDelimited = tokens.length === 0

    // Iterate over the tokens and create our regexp string.
    for (var i = 0; i < tokens.length; i++) {
        var token = tokens[i]

        if (typeof token === 'string') {
            route += escapeString(token)
            isEndDelimited = i === tokens.length - 1 && delimiters.indexOf(token[token.length - 1]) > -1
        } else {
            var capture = token.repeat
                ? '(?:' + token.pattern + ')(?:' + escapeString(token.delimiter) + '(?:' + token.pattern + '))*'
                : token.pattern

            if (keys) keys.push(token)

            if (token.optional) {
                if (token.partial) {
                    route += escapeString(token.prefix) + '(' + capture + ')?'
                } else {
                    route += '(?:' + escapeString(token.prefix) + '(' + capture + '))?'
                }
            } else {
                route += escapeString(token.prefix) + '(' + capture + ')'
            }
        }
    }

    if (end) {
        if (!strict) route += '(?:' + delimiter + ')?'

        route += endsWith === '$' ? '$' : '(?=' + endsWith + ')'
    } else {
        if (!strict) route += '(?:' + delimiter + '(?=' + endsWith + '))?'
        if (!isEndDelimited) route += '(?=' + delimiter + '|' + endsWith + ')'
    }

    return new RegExp(route, flags(options))
}

/**
 * Normalize the given path string, returning a regular expression.
 *
 * An empty array can be passed in for the keys, which will hold the
 * placeholder key descriptions. For example, using `/user/:id`, `keys` will
 * contain `[{ name: 'id', delimiter: '/', optional: false, repeat: false }]`.
 *
 * @param  {(string|RegExp|Array)} path
 * @param  {Array=}                keys
 * @param  {Object=}               options
 * @return {!RegExp}
 */
function pathToRegexp(path, keys, options) {
    if (path instanceof RegExp) {
        return regexpToRegexp(path, keys)
    }

    if (Array.isArray(path)) {
        return arrayToRegexp(/** @type {!Array} */(path), keys, options)
    }

    return stringToRegexp(/** @type {string} */(path), keys, options)
}
/*=============================================================/path-to-regexp=============================================*/

const patternCache = {}
const cacheLimit = 10000
let cacheCount = 0

const compilePath = (pattern, options) => {
    const cacheKey = `${options.end}${options.strict}${options.sensitive}`
    const cache = patternCache[cacheKey] || (patternCache[cacheKey] = {})

    if (cache[pattern])
        return cache[pattern]

    const keys = []
    const re = pathToRegexp(pattern, keys, options)
    const compiledPattern = { re, keys }

    if (cacheCount < cacheLimit) {
        cache[pattern] = compiledPattern
        cacheCount++
    }

    return compiledPattern
}

/**
 * Public API for matching a URL pathname to a path pattern.
 */
const matchPath = (pathname, options = {}) => {
    if (typeof options === 'string')
        options = { path: options }

    const { path = '/', exact = false, strict = false, sensitive = false } = options
    const { re, keys } = compilePath(path, { end: exact, strict, sensitive })
    const match = re.exec(pathname)

    if (!match)
        return null

    const [url, ...values] = match
    const isExact = pathname === url

    if (exact && !isExact)
        return null

    return {
        path, // the path pattern used to match
        url: path === '/' && url === '' ? '/' : url, // the matched portion of the URL
        isExact, // whether or not we matched exactly
        params: keys.reduce((memo, key, index) => {
            memo[key.name] = values[index]
            return memo
        }, {})
    }
}

/*============================================================/matchPath==============================================*/

// class Router extends React.Component {
//     constructor(props) {
//         super(props)
//         this.state = {
//             match: this.computeMatch(props.history.location.pathname)
//         }
//     }

//     getChildContext() {
//         return {
//             router: {
//                 ...this.context.router,
//                 history: this.props.history,
//                 route: {
//                     location: this.props.history.location,
//                     match: this.state.match,
//                 }
//             }
//         }
//     }

//     computeMatch(pathname) {
//         return {
//             path: '/',
//             url: '/',
//             params: {},
//             isExact: pathname === "/",
//         }
//     }

//     componentWillMount() {
//         const { history } = this.props
//         this.unlisten = history.listen(() => {
//             this.setState({
//                 match: this.computeMatch(history.location.pathname)
//             })
//         })
//     }

//     componentWillReceiveProps(nextProps) {

//     }

//     componentWillUnmount() {
//         this.unlisten()
//     }

//     render() {
//         const { children } = this.props
//         return children ? React.Children.only(children) : null
//     }
// }

// class BrowserRouter extends React.Component {
//     constructor(props) {
//         super(props)
//         this.history = History.createBrowserHistory(props)
//     }

//     render() {
//         return <Router history={this.history} children={this.props.children} />
//     }
// }

// class HashRouter extends React.Component {
//     constructor(props) {
//         super(props)
//         this.history = History.createHashHistory(props)
//     }

//     render() {
//         return <Router history={this.history} children={this.props.children} />
//     }
// }

// class Route extends React.Component {
//     constructor(props) {
//         super(props)
//         this.state = {
//             match: this.computeMatch(this.props, this.context.router)
//         }
//     }

//     getChildContext() {
//         return {
//             router: {
//                 ...this.context.router,
//                 route: {
//                     location: this.props.location,
//                     match: this.state.match
//                 }
//             }
//         }
//     }

//     /**
//      * props => computedMatch, location, path, strict, exact, sensitive
//      * @param {*props} param0 
//      * @param {*context.router} router 
//      */
//     computeMatch({ computedMatch, location, path, strict, exact, sensitive }, router) {
//         // for Switch
//         if (computedMatch) {
//             return computedMatch
//         }

//         const { route } = router
//         const pathname = (location || route.location).pathname
//         return path ? matchPath(pathname, { path, strict, exact, sensitive }) : route.match
//     }

//     componentWillReceiveProps(nextProps, nextContext) {
//         this.setState({
//             match: this.computeMatch(nextProps, nextContext.router)
//         })
//     }

//     render() {
//         const { match } = this.state
//         const { children, component, render } = this.props
//         const { history, route, staticContext } = this.context.router
//         const location = this.props.location || route.location
//         const props = { match, location, history, staticContext }

//         return (
//             component ? ( // component prop gets first priority, only called if there's a match
//                 match ? React.createElement(component, props) : null
//             ) : render ? ( // render prop is next, only called if there's a match
//                 match ? render(props) : null
//             ) : children ? ( // children come last, always called
//                 typeof children === 'function' ? (
//                     children(props)
//                 ) : !isEmptyChildren(children) ? (
//                     React.Children.only(children)
//                 ) : (
//                         null
//                     )
//             ) : (
//                     null
//                 )
//         )
//     }
// }

// const isModifiedEvent = (event) =>
//     !!(event.metaKey || event.altKey || event.ctrlKey || event.shiftKey)

// class Link extends React.Component {
//     constructor(props) {
//         super(props)
//         this.handleClick = this.handleClick.bind(this)
//     }
//     handleClick(event) {
//         if (this.props.onClick)
//             this.props.onClick(event)

//         if (
//             !event.defaultPrevented && // onClick prevented default
//             event.button === 0 && // ignore right clicks
//             !this.props.target && // let browser handle "target=_blank" etc.
//             !isModifiedEvent(event) // ignore clicks with modifier keys
//         ) {
//             event.preventDefault()

//             const { history } = this.context.router
//             const { replace, to } = this.props

//             if (replace) {
//                 history.replace(to)
//             } else {
//                 history.push(to)
//             }
//         }
//     }

//     render() {
//         const { replace, to, innerRef, ...props } = this.props // eslint-disable-line no-unused-vars

//         const href = this.context.router.history.createHref(
//             typeof to === 'string' ? { pathname: to } : to
//         )

//         return <a {...props} onClick={this.handleClick} href={href} ref={innerRef} />
//     }
// }

// let ReactRouterDOM = {
//     BrowserRouter,
//     HashRouter,
//     Router,
//     Route,
//     // Switch,
//     // Redirect,
//     Link,

// }