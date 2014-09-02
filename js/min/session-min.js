var Session=function e(n){var t={},a=0,i=$("#content"),o;t.id=0,t.userData={};var s;t.stages=["intro.html","namegenerator.html"];var d;return t.options={fnBeforeStageChange:function(){var e=new Event("changeStageStart");window.dispatchEvent(e)},fnAfterStageChange:function(){var e=new Event("changeStageEnd");window.dispatchEvent(e)}},t.init=function(){notify("Session initialising.",1),extend(t.options,n),window.addEventListener("changeStageStart",function(){$(".loader").transition({opacity:1})},!1),window.addEventListener("changeStageEnd",function(){$(".loader").transition({opacity:0})},!1),o=new IOInterface,localStorage.getObject("activeSession")!==!1?(t.id=localStorage.getObject("activeSession"),notify("Existing session found (session id: "+t.id+"). Loading.",3),o.init(t.id),o.load(t.updateUserData)):(notify("No existing session found. Creating new session.",3),t.id=o.init(),window.nodes=t.registerData("nodes",!0),window.edges=t.registerData("edges",!0)),t.registerData("session"),History.Adapter.bind(window,"statechange",function(){});var e=History.getState();t.goToStage(e.data.stage?e.data.stage:0),window.addEventListener("unsavedChanges",function(){t.saveManager()},!1)},t.saveManager=function(){clearTimeout(d),d=setTimeout(t.saveData,2e3)},t.updateUserData=function(e){notify("Updating user data.",2),notify("Using the following to update:",1),notify(e,1),notify("session.userData is:",1),notify(t.userData,1),extend(t.userData,e),notify("Combined output is:",0),notify(t.userData,0),window.nodes=t.registerData("nodes",!0),window.edges=t.registerData("edges",!0);var n=new Event("newDataLoaded");window.dispatchEvent(n);var a=new Event("unsavedChanges");window.dispatchEvent(a)},t.returnSessionID=function(){return t.id},t.saveData=function(){o.save(t.userData),s=new Date},t.addNode=function(e){var n={id:window.nodes.length+1,label:"Josh"};extend(n,e),window.nodes.push(n);var t=new CustomEvent("log",{detail:{eventType:"nodeCreate",eventObject:n}});window.dispatchEvent(t);var a=new CustomEvent("nodeAdded",{detail:n});window.dispatchEvent(a);var i=new Event("unsavedChanges");window.dispatchEvent(i)},t.addEdge=function(e,n){var t=!1,a={from:e,to:n};if(t)return!1;window.edges.push(a);var i=new Event("edgeAdded",{options:a});window.dispatchEvent(i);var o=new Event("unsavedChanges");window.dispatchEvent(o)},t.goToStage=function(e){t.options.fnBeforeStageChange();var n=e;i.transition({opacity:"0"},400,"easeInSine").promise().done(function(){i.load("stages/"+t.stages[e],function(){i.transition({opacity:"1"},400,"easeInSine")})}),a=n,History.pushState({stage:e},null,"?stage="+e),t.options.fnAfterStageChange();var o=new Event("unsavedChanges");window.dispatchEvent(o)},t.nextStage=function(){t.goToStage(a+1)},t.prevStage=function(){t.goToStage(a-1)},t.addStage=function(){},t.registerData=function(e,n){notify('Something registered a data store with the key "'+e+'".',2),void 0===t.userData[e]&&(notify(e+" was not already registered. Creating.",2),t.userData[e]=n?[]:{});var a=new Event("unsavedChanges");return window.dispatchEvent(a),t.userData[e]},t.addData=function(e,n,a){a||(a=!1),a===!0?(console.log(typeof t.userData[e].length),t.userData[e].push(n)):extend(t.userData[e],n),notify("Adding data to key '"+e+"'.",2),notify(n,1);var i=new Event("unsavedChanges");window.dispatchEvent(i)},t.returnData=function(e){return e&&"undefined"!=typeof t.userData[e]?t.userData[e]:t.userData},t.init(),t};
//# sourceMappingURL=./session-min.map