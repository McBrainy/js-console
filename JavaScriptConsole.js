/*
 * This is the main Javascript file.
 * It handles all event listeners and DOM
 * manipulation.
 *
 * copyright (c) 2013 Brian McCutchon.
 */

var ask, echo, askHTML, echoHTML, run, runFile,
	showEditor, showCode, save, info, help, clr,
	PROMPT = "&gt; ";

location.hash = "";

(function($) {
	"use strict";
	
	// Private vars
	var historyPosition = 0,
		editorWindows = new Array(0),
		waitForCallback = false,
		editorHasBeenShown = false,
		doc, // CodeMirror doc
		height, // preferred height for console + editor, info page
		ALL_EVENTS = 'blur focus load resize scroll click dblclick ' +
		'mousedown mouseup mousemove change select keydown keypress keyup';
	
	/*
	 * Global event listeners
	 */
	
	function resize() {
		height = window.innerHeight - $('#header').height() - 20;
		$('#back').height(height);
		if (document.getElementById("editor").style.display === "none") {
			$('#console').height(height);
		}
		else {
			$('#console').height(height/2 - 20);
		}
		
		if (doc) {
			doc.getEditor().setSize(null,height/2-25);
		}
	}
	
	window.addEventListener('resize', resize);
	
	window.addEventListener('load', function() {
		var css = document.createElement('div').style;
		if ('backfaceVisibility' in css ||
			'MsBackfaceVisibility' in css ||
			'MozBackfaceVisibility' in css ||
			'WebkitBackfaceVisibility' in css)
		{
			document.getElementById('back').style.display = 'table';
			
			$('#info-icon').css('display','block').on('click', info);
			
			$('#done').on('click', function() {
				$('#card').removeClass('flipped');
			});
		}
		
		resize();
		
		askForCommand();
	});
	
	window.addEventListener('keydown', function(event) {
		// Keyboard shortcuts!
		var key = (event.keyCode || event.which);
		if (event.metaKey && event.shiftKey && !event.altKey) {
			if (key === 82) { // CMD - shift - R
				event.preventDefault();
				document.getElementById('command-line').focus();
			} else if (key === 67) { // CMD - shift - C
				event.preventDefault();
				showCode('clr();');
			}
		}
		else if (event.metaKey && !(event.altKey||event.shiftKey)) { // CMD - S
			if (key === 83) {
				event.preventDefault();
				save();
			} else if (key === 69) { // CMD - E
				event.preventDefault();
				showEditor();
			}
		}
	});
	
	// From https://developer.mozilla.org/en-US/docs/Mozilla_event_reference/beforeunload
	window.addEventListener("beforeunload", function(event) {
		var windowsAreOpen, i, confirmationMessage =
			"Leaving this page will close all external editor windows. " +
				"Are you sure you want to leave?";
		for(i=0;i<editorWindows.length && !windowsAreOpen;i++) {
			windowsAreOpen = !editorWindows[i].closed;
		}
		if (windowsAreOpen) {
			event.returnValue = confirmationMessage;	// Gecko + IE
			return confirmationMessage;					// Webkit, Safari, Chrome etc.
		}
	});
	
	window.addEventListener('unload', function() {
		var i;
		for (i=0;i<editorWindows.length;i++) {
			editorWindows[i].close();
		}
	});
	
	/*
	 * Private functions
	 */

/*	function toggleDisplay(event) {
		if ($(event.target).width() <= $(event.target.parentNode).width() * 0.9) {
			$(event.target).css("display", "inline-block");
		}
		else {
			$(event.target).css("display", "inline");
		}
	}
*/
	// date functions
	function get12hr(d) {
		var a = d.getHours();
		return a >= 12 ? a-12 : a;
	}
	
	function getAmPm(d) {
		return d.getHours() < 12 ? 'am' : 'pm';
	}
	
	// Fancy number-to-string function
	function getLeading(x) {
		x = x.toString();
		return x.length < 2 ? '0' + x : x;
	}
	
	// html (un)escape functions
	function escapeHTML(html) {
		return String(html).replace(/&/g,'&amp;').replace(/>/g,'&gt;').replace(/</g,'&lt;');
	}

	function unescapeHTML(html) {
		return String(html).replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&amp;/g,'&');
	}
	
	// keydown handler for command line 
	function keyDown(event) {
		var code = (event.keyCode || event.which);
	
		// browse command history if up/down key pressed
		if (code === 38) { // up key pressed
			event.preventDefault();
			historyPosition -= 1;
			if (historyPosition >= 0){
				event.target.innerHTML = document.getElementsByClassName("command")[historyPosition].innerHTML;
			}
			else {
				historyPosition = 0;
			}
		} else if (code === 40) { // down key pressed
			event.preventDefault();
			historyPosition += 1;
			var command = document.getElementsByClassName("command");
			if (historyPosition < command.length){
				event.target.innerHTML = command[historyPosition].innerHTML;
			}
			else {
				historyPosition = command.length;
				event.target.innerHTML = "";
			}
		}
	}
	
	// fancy object-to-string functions
	function objToStr(Obj) {
		if (typeof Obj === "string") { return '"' + Obj.replace(/"/g,'\\"') + '"'; }
		if (Obj instanceof Array) { return arrToStr(Obj); }
		return Obj;
	}
	
	function arrToStr(myArray) {
		var newArr = [];
		for (var i=0;i<myArray.length;i++) {
			newArr.push(objToStr(myArray[i]));
		}
		return "[" + newArr + "]";
	}
	
	function scrollDown() {
		var mydiv = document.getElementById('OutputWindow');
		if (mydiv.scrollHeight) { // Most browsers
			mydiv.scrollTop = mydiv.scrollHeight;
		} else { // IE7 and earlier
			mydiv.scrollTop = "99999999999px";
		}
	}
	
	function getPrompt() {
		var p = PROMPT, d = new Date();
		if (typeof p === 'function') { p = p(); }
		
		return p.replace(/\$u;/ig,'Guest')
			.replace(/\$n;/ig,document.getElementsByClassName("command").length+1)
			.replace(/\$H;/g,d.getHours())
			.replace(/\$h;/g,getLeading(d,'Hours'))
			.replace(/\$12H;/g,get12hr(d))
			.replace(/\$12h;/g,getLeading(d,'12hr'))//?
			.replace(/\$ap;/g,getAmPm(d))
			.replace(/\$AP;/g,getAmPm(d).toUpperCase())
			.replace(/\$MIN;/g,d.getMinutes())
			.replace(/\$min;/g,getLeading(d,'Minutes'))
			.replace(/\$S;/g,d.getSeconds())
			.replace(/\$s;/g,getLeading(d,'Seconds'))
			.replace(/\$Y;/g,d.getFullYear())
			.replace(/\$y;/g,/\d\d$/.exec(d.getFullYear().toString()))
			.replace(/\$d;/g,d.getDate())
			.replace(/\$D;/g,/\w+/.exec(d.toString()))
			.replace(/\$m;/g,d.getMonth())
			.replace(/\$M;/g,getLeading(d,'Month'))
			.replace(/\$mo;/g,d.toString().match(/\w\s+(\w+)/)[1])
			.replace(/\$;/g,'$');
	}
	
	// outputs command line
	function askForCommand() {
		waitForCallback = false;
		askHTML(getPrompt(), execute);
	}
	
	function endWith(callback) {
		waitForCallback = false;
		if ($.isFunction(callback)) { callback(); }
		if (!waitForCallback) { askForCommand(); }
	}
	
	// globally evaluates code and displays the result
	function execute(command) {
		var result;
		command = unescapeHTML(command);
		try {
			// globally evaluate code - based on jQuery.globalEval()
			result = (function(code) {
				return window.eval.call(window, code);
			})(command);
			
			if (result !== undefined) {
				echo(objToStr(result)); // Output result
			}
		}
		catch (error) {
			echoHTML("<span class='err'>✘</span> " +
				(error.name && error.message ?
					error.name+': '+error.message :
					error));
		}
	}
	
	// evaluates code within a new Function ("sandbox" scope) and displays the result
	function funcExec(code) {
		try {
			new Function(code)(); // eval code
		}
		catch (error) { // display error message
			echoHTML("<span class='err'>✘</span> " +
				(error.name && error.message ?
					error.name + ': ' + error.message :
					error));
		}
	}
	
	/*
	 * Public functions that use private functions/vars
	 */

	ask = function ask(txt, callback) {
		askHTML(txt === undefined ? escapeHTML(txt) : txt, callback);
	};
	
	echo = function echo(txt) {
		echoHTML(txt === undefined ? escapeHTML(txt) : txt);
	};
	
	askHTML = function askHTML(text, callback) {
		if (waitForCallback) { return; }
		waitForCallback = true;
		
		$(document.createElement('span'))
			.attr('id','command-line')
			.attr('contenteditable','true')
			.on('keydown', function(event) {
				if (event.keyCode === 13) {
					event.preventDefault();
					$(this)
						.removeAttr('id')
						.removeAttr('contenteditable')
						.addClass('command')
						.off(ALL_EVENTS);
					waitForCallback = false;
					if ($.isFunction(callback)) { callback(unescapeHTML(this.innerHTML)); }
					if (!waitForCallback) { askForCommand(); }
				}
				else { keyDown(event); }
			})
			//.on(ALL_EVENTS,toggleDisplay)
			.appendTo($(document.createElement('div'))
				.html(text || '?')
				.appendTo($('#OutputText')))
			.focus().click();
	
		// reset command history
		historyPosition = document.getElementsByClassName("command").length;
	};
	
	echoHTML = function echoHTML(txt) {
		if (waitForCallback) { return; }
		document.getElementById("OutputText").innerHTML += '<div>' + txt + '</div>';
		scrollDown();
	};

	// Shows the internal editor
	// newWindow = Open in a new window? default is false
	showEditor = function showEditor(newWindow) {
		if (newWindow) {
			editorWindows.length++;
			var editor = window.open("jseditor?n=" + editorWindows.length);
			if (!editor || editor.closed) { // pop-up blocked
				editorWindows.length--;
				throw "Please modify your browser's preferences to allow pop-ups from this site.";
			}
			else {
				editorWindows[editorWindows.length-1] = editor;
			}
		}
		else if (document.getElementById("editor").style.display === "none") {
			$("#console").animate({height:height/2-20},"fast",function() {
				scrollDown();
				if (editorHasBeenShown) {
					$("#editor").fadeIn("slow");
					$("#editor").css("display","block");
				}
				else {
					editorHasBeenShown = true;
					$("#editor").css("display","block");
					var cm = new CodeMirror(document.getElementById('editor'), {
							indentWithTabs:true,
							indentUnit:4,
							lineNumbers:true,
							autofocus:true,
							theme:'ambiance'
						});
					cm.setSize(null,height/2-25);
					doc = cm.getDoc();
					
					$("#editor").append(
						$('<a class="button" id="run" title="run()"><span class="name">run</span>()</a>')
							.click(function(){showCode('run();');}),
						$('<a class="button" id="save" title="save()"><span class="name">save</span>()</a>')
							.click(function(){save();}),
						$('<a class="button" id="redo" title="redo">--&gt;</a>').click(function(){doc.redo();}),
						$('<a class="button" id="undo" title="undo">&lt;--</a>').click(function(){doc.undo();}),
						$('<a class="button" id="comment" title="comment">/*&hellip;*/</a>').click(function(){
							var sel = doc.getSelection();
							if (/^\/\*[\s\S]*\*\/$/.test(sel)) { // remove comment
								doc.replaceSelection(sel.replace(/^\/\*|\*\/$/g,''));
							}
							else { // make comment
								doc.replaceSelection('/*' + sel.replace(/\*\//g,"*\\/") + '*\/');
							}
						})
					);
				//	cm.on('contextmenu',function(c,e) {
				//		e.preventDefault();
				//		//e.codemirrorIgnore = true;
				//		console.log('default prevented');
				//		return false;
				//	});
				}
			});
		}
		else {
			$("#editor").fadeOut("fast",function() {
				$("#console").animate({height:height},"fast");
			});
		}
	};
	
	runFile = function runFile() {
		if (!FileReader) {
			throw "Your browser doesn't support the FileReader interface.";
		}
		var fr = new FileReader(),
			fileInput = $('<input type="file" name="script" />')
				.on('change',function(e){e.target.form.run.click();});
		
		waitForCallback = true;
		
		fr.onload = function(e) {
			waitForCallback = false;
			funcExec(e.target.result);
			if (!waitForCallback) { askForCommand(); }
		};
		
		$(document.createElement('form'))
			.appendTo($('#OutputText'))
			.on('submit', function(e) {
				if (this.script.files.length === 0) {
					askForCommand();
				}
				else {
					fr.readAsText(this.script.files[0]);
				}
				this.parentNode.removeChild(this);
				e.preventDefault();
				return false;
			})
			.append(fileInput)
			.append('<input type="submit" name="run" value="Run" />');
		
		fileInput.click();
	};
	
	// source - the # of the window to run from or string url of script to load
	// all arguments are optional
	run = function run(source, callback) {
		if (isNaN(Number(source)) && typeof source === 'string') {
			waitForCallback = true;
			$.getScript(source, function() {
				endWith(callback);
			})
			.fail(function() {
				echoHTML('<span class="err">✘</span>Script failed to load.');
				askForCommand();
			});
		}
		else if (arguments.length === 0 || !isNaN(Number(source))) {
			if (!doc) { return; }
			var userCode;
			// load defaults for args
			if (source) {
				userCode = editorWindows[source-1].doc.getValue();
			}
			else { // default
				userCode = doc.getValue();
			}
			
			funcExec(userCode);
		}
		else {
			throw new TypeError('First argument must be a number or string URL');
		}
	};
	
	showCode = function showCode(code) {
		var comLine = document.getElementById('command-line');
		if (comLine) { // called from a button
			comLine.innerHTML = escapeHTML(code);
			$(comLine)
				.removeAttr('id')
				.removeAttr('contenteditable')
				.addClass('command')
				.off(ALL_EVENTS);
			waitForCallback = false;
			execute(code);
			if (!waitForCallback) { askForCommand(); }
		}
		else { // called by user
			echoHTML(getPrompt() + '<span class="command">' + escapeHTML(code) + "</span>");
			execute(code);
		}
	};
	
	save = function save(name) {
		if (!doc) { return; } // editor was never opened
		
		// Create iFrame
		var iframe = document.createElement('iframe');
		iframe.style.display = "none";
		document.body.appendChild(iframe);
		
		// Get the iframe's document
		var iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
		
		// Make a form
		var form = document.createElement('form');
		form.action = 'save';
		form.method = 'POST';
		
		// Add form element for content
		var input = document.createElement('input');
		input.type = 'hidden';
		input.name = 'content';
		input.value = doc.getValue();
		form.appendChild(input);
		
		// Add form element for filename
		input = document.createElement('input');
		input.type = 'hidden';
		input.name = 'filename';
		input.value = name || '';
		form.appendChild(input);
		
		// Add form to iFrame
		// IE doesn't have the "body" property
		(iframeDoc.body || iframeDoc).appendChild(form);
		
		// Post the form :-)
		form.submit();
	};
	
	clr = function clr() {
		document.getElementById("OutputText").innerHTML = "";
	};
	
	help = function help() {
		return "Functions peculiar to this console:\n" +
			"ask\t askHTML\t clr\t echo\t echoHTML\t info\t run\t runFile\t save\t showCode\t showEditor\n" +
			"Enter the name of a function to learn more about it.";
	};
	
	info = function info() {
		$('#card').addClass('flipped');
	};
}(jQuery));

/*
Function.prototype.applyWithoutContext = function() {
	var i, code = 'this(';
	for (i=0; i<arguments.length; i++) {
		if (i) { code += ',' }
		code += 'arguments[' + i + ']';
	}
	eval(code + ');');
}
*/

// Now jQuery is private
jQuery.noConflict(true);

/*
 * toString functions
 */

ask.toString = function() {
	return 'ask([PromptText = "?"[, callback]]) {\n' +
		'\t// callback is a function that will be called after the user enters a value.\n' +
		'\t// The user\'s response will be passed as the first argument.\n}';
};

askHTML.toString = function() {
	return 'function askHTML([PromptText = "?"[, callback]]) {\n' +
		'\t// This function is like ask, but it allows the prompt to contain HTML formatted text.\n}';
};

clr.toString = function() {
	return 'function clr() {\n\t// clears the console window\n\t// shortcut: metaKey + shift + C\n}';
};

echo.toString = function() {
	return 'function echo(text) {\n' +
		'\t// Outputs provided text to the console.\n}';
};

echoHTML.toString = function() {
	return 'function echoHTML(text) {\n' +
		'\t// This function is like echo, but it allows you to echo HTML formatted text.\n}';
};

help.toString = function() {return this();};

info.toString = function() {return 'function info() {\n\t// used to view information about the console.\n}';};

run.toString = function() {
	return 'function run([source = 0[, callback]]) {\n' +
		'\t// Runs the code from an editor, or loads and runs an external (hosted) JavaScript file.\n' +
		'\t// (If you want to run a local file, use runFile.)' +
		'\t// If source is a number, it represents the number of the editor window to use.\n' +
		'\t// (Default is 0, or the internal editor.)\n' +
		'\t// Otherwise, it is treated as a string URL.\n' +
		'\t// callback is a function to be run when the script has been loaded.\n}';
};

runFile.toString = function() {
	return 'function runFile() {\n\t// Loads and executes a local file.\n}';
};

save.toString = function() {
	return 'function save(filename) {\n' +
		'\t// Saves the contents of the editor to a local file.\n}';
};

showCode.toString = function() {
	return 'function showCode(code) {\n' +
		"\t// Displays a piece of code, executes it, and displays the result.\n}";
};

showEditor.toString = function() {
	return 'function showEditor([newWindow = false]) {\n' +
		'\t// This function opens an internal syntax editor.\n' +
		'\t// newWindow = open in a new window?\n' +
		'\t// You can also use metaKey + E as a shortcut.\n}';
};

/*
L0G1N.toString = function(){
	return 'function L0G1N([name[, P/\\55\\/\\/0RD]]) {\n' +
		'\t// Both parameters are technically optional,\n' +
		'\t// but if you don\'t supply them you\'ll be asked for them.\n}';
};
*/
