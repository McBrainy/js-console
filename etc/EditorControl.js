/*
This script contains functions relating to the control and syntax-based 
formatting of the internal editor. They are all called by events or other 
functions in this file. syntax() is also called when the editor is opened.
*/

//var saveSelection, restoreSelection, savedIndex;

/*
$(document).ready(function() {
	$('input,textarea,[contenteditable]').on('keydown',function(event) {
		if (event.metaKey && !event.ctrlKey && event.keyCode == 39) {
			event.preventDefault();
			alert('CMD-right stopped');
			// move cursor to end
			// http://stackoverflow.com/questions/1125292/how-to-move-cursor-to-end-of-contenteditable-entity/3866442#3866442
			var range, selection;
			if (document.createRange) { // Firefox, Chrome, Opera, Safari, IE 9+
				range = document.createRange();//Create a range (a range is a like the selection but invisible)
				range.selectNodeContents(this);//Select the entire contents of the element with the range
				range.collapse(false);//collapse the range to the end point. false means collapse to end rather than the start
				selection = window.getSelection();//get the selection object (allows you to change selection)
				selection.removeAllRanges();//remove any selections already made
				selection.addRange(range);//make the range you have just created the visible selection
			} else if (document.selection) { // IE 8 and lower
				range = document.body.createTextRange();//Create a range (a range is a like the selection but invisible)
				range.moveToElementText(this);//Select the entire contents of the element with the range
				range.collapse(false);//collapse the range to the end point. false means collapse to end rather than the start
				range.select();//Select the range (make it the visible selection)
			}
		} else if (event.metaKey && !event.ctrlKey && event.keyCode == 37) {
			event.preventDefault();
			console.log('CMD-left stopped');
		}
	});
});
*/


/*
function keydown(event) {
	if (event.keyCode == 9) // tab key pressed
	{
		event.preventDefault(); // prevent focus out
		insertHtmlAtCursor("	"); // insert tab character
	}
	
	if (event.keyCode == 13) // enter key pressed
	{
		event.preventDefault();
		var editor = document.getElementById("syntaxEditor");
		var tabs = ""; // empty string
		insertHtmlAtCursor("\n");
		var currentPos = editor.innerHTML.lastIndexOf("\n",findCaretInHTML(editor)) - 1;
		currentPos = editor.innerHTML.lastIndexOf("\n",currentPos) + 1;
		while (editor.innerHTML.charAt(currentPos)==" "    // space
			|| editor.innerHTML.charAt(currentPos)=="	") // tab char
		{
			tabs += editor.innerHTML.charAt(currentPos); // add space/tab char
			currentPos++;
		}
		insertHtmlAtCursor(tabs);
	}
}

// modified from http://stackoverflow.com/questions/2213376/how-to-find-cursor-position-in-a-contenteditable-div
function insertHtmlAtCursor(html)
{
	if (window.getSelection && window.getSelection().getRangeAt) {
		html += "<span id='caret'></span>";
		var sel = window.getSelection();
		var range = sel.getRangeAt(0);
		var node = range.createContextualFragment(html);
		range.deleteContents();
		range.insertNode(node);
		range.collapse(0);
		sel.removeAllRanges();
		sel.addRange(range);
		var container = document.getElementById("syntaxEditor");
		var caret = document.getElementById("caret");
		var caretTop = caret.offsetTop - container.offsetTop;
		var caretBottom = caretTop - caret.offsetHeight;
		if (caretTop < container.scrollTop) {
			container.scrollTop = caretTop - 5;
		} else if (caretBottom > container.scrollTop+container.clientHeight-30) {
			container.scrollTop = caretBottom - container.clientHeight + 30;
		}
	} else if (document.selection && document.selection.createRange) {
		document.selection.createRange().pasteHTML(html);
		// ?
	}
}

// find HTML caret position within contenteditable element
// based on previous
// This will delete selection contents
function findCaretInHTML(element)
{
	if (window.getSelection && window.getSelection().getRangeAt) {
		var range, node, caret;
		range = window.getSelection().getRangeAt(0);
		range.deleteContents();
		node = range.createContextualFragment("<span id=\"caret\"></span>");
		range.insertNode(node);
		caret = element.innerHTML.indexOf("<span id=\"caret\"></span>");
		range.deleteContents();
		return caret;
	} else if (document.selection && document.selection.createRange) {
		// ?
	} else return null;
}

// Limitation - may fail if position 
//  is within a tag that has children
function isWithinTag(code, position)
{
	var openBracket, closeBracket, slash;
	while (true) {
		openBracket = code.lastIndexOf("<",position);
		closeBracket = code.lastIndexOf(">",position);
		if (openBracket > closeBracket) return true;
		if (openBracket == -1) return false;
		slash = code.lastIndexOf("/",position);
		if (slash == closeBracket - 1){//eg. <br />
			position = openBracket - 1;
		} else if (slash == openBracket + 1){//close tag, eg. </span>
			return false;
		} else if (closeBracket<slash){//slash not part of tag
			position = slash - 1;
		} else return true; //opening tag
	}
}

// Intended to be called as a method on a string
// searchValue = a GLOBAL RegExp
// backmatching: Should it match all occurences, including possible nested? default = false
// capturingGroup is optional. default is the entire match (0)
// WARNING: Using capturingGroup and backmatching together may cause 
//  problems if the capturing group is not at the end of the regexp.
String.prototype.makeSpan = function(searchValue,spanClass,backmatching,capturingGroup)
{
	if (arguments.length < 4) capturingGroup = 0;
	var i=0, matches=new Array(), location=new Array(), code=this.valueOf();
	var repeat, index, lengthChange;
	repeat = true;
	do {
		matches[i] = searchValue.exec(code);
		if (matches[i] != null) {
			matches[i] = String(matches[i][capturingGroup]);
			location[i] = searchValue.lastIndex;
			if (backmatching){
				searchValue.lastIndex=searchValue.lastIndex-matches[i].length+1;
			}
			i++;
		} else {
			repeat = false;
		}
	} while (repeat);
	for (i=0;i<matches.length-1;i++) {
		if (location[i]!=-1 && !isWithinTag(code,location[i]-matches[i].length-1) && 
		(!isWithinTag(code,location[i]-1) || spanClass=="comment")) {
			if (backmatching){
				index = i + 1;
				while (matches[index] && location[index]-matches[index].length-1 < location[i]) {
					location[index] = -1;
					index++;
				}
			}
			code = [
				code.substring(0, location[i] - matches[i].length),
				code.substring(location[i] - matches[i].length, location[i]),
				code.substring(location[i])
			];
			lengthChange = code[1].length;
			code[1] = code[1].replace(/<[^>]*>/g,"");
			code[1] = "<span class='" + spanClass + "'>" + code[1] + "</span>";
			lengthChange = code[1].length - lengthChange;
			code = code.join("");
			for (index=0;index<location.length;index++) {
				location[index] += lengthChange;
			}
		}
	}
	return code;
}

if (window.getSelection && document.createRange) {
    saveSelection = function(containerEl) {
        var range = window.getSelection().getRangeAt(0);
        var preSelectionRange = range.cloneRange();
        preSelectionRange.selectNodeContents(containerEl);
        preSelectionRange.setEnd(range.startContainer, range.startOffset);
        var start = preSelectionRange.toString().length;

        return {
            start: start,
            end: start + range.toString().length
        }
    };

    restoreSelection = function(containerEl, savedSel) {
        var charIndex = 0, range = document.createRange();
        range.setStart(containerEl, 0);
        range.collapse(true);
        var nodeStack = [containerEl], node, foundStart = false, stop = false;

        while (!stop && (node = nodeStack.pop())) {
            if (node.nodeType == 3) {
                var nextCharIndex = charIndex + node.length;
                if (!foundStart && savedSel.start >= charIndex && savedSel.start <= nextCharIndex) {
                    range.setStart(node, savedSel.start - charIndex);
                    foundStart = true;
                }
                if (foundStart && savedSel.end >= charIndex && savedSel.end <= nextCharIndex) {
                    range.setEnd(node, savedSel.end - charIndex);
                    stop = true;
                }
                charIndex = nextCharIndex;
            } else {
                var i = node.childNodes.length;
                while (i--) {
                    nodeStack.push(node.childNodes[i]);
                }
            }
        }

        var sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
    }
} else if (document.selection) {
    saveSelection = function(containerEl) {
        var selectedTextRange = document.selection.createRange();
        var preSelectionTextRange = document.body.createTextRange();
        preSelectionTextRange.moveToElementText(containerEl);
        preSelectionTextRange.setEndPoint("EndToStart", selectedTextRange);
        var start = preSelectionTextRange.text.length;

        return {
            start: start,
            end: start + selectedTextRange.text.length
        }
    };

    restoreSelection = function(containerEl, savedSel) {
        var textRange = document.body.createTextRange();
        textRange.moveToElementText(containerEl);
        textRange.collapse(true);
        textRange.moveEnd("character", savedSel.end);
        textRange.moveStart("character", savedSel.start);
        textRange.select();
    };
}

function selectFunc(event)
{
	if (typeof getSelection != "undefined" && event.target.selectedIndex) {
		location.hash = event.target.selectedIndex-1;
		var sel = window.getSelection();
		var range = document.createRange();
		var node = document.getElementById(event.target.selectedIndex-1);
		range.selectNodeContents(node);
		sel.removeAllRanges();
		sel.addRange(range);
	}
}

// updates syntax formatting in the editor
// source - optional - use an external editor window
function syntax()
{
	var editor = document.getElementById('syntaxEditor');
	var code = editor.innerHTML;
	var sel;
	try {
		sel = saveSelection(editor);
	} catch (err) {
		if (err.name=="INDEX_SIZE_ERR"||"IndexSizeError") {
			sel = {start:0,end:0}
		} else throw err;
	}
	code = code.replace(/<br\s*(\/)?>|\r\n|\n\r|\r|\n/ig,"\r\n"); // format line breaks
	code = code.replace(/<.*?>/g,""); // remove formatting
	
	// reveal syntax by replacing...
	// reserved words
	code = code.replace(/\bin\b/g,"<span class='keyword'>in</span>");
	code = code.replace(/\bif\b/g,"<span class='keyword'>if</span>");
	code = code.replace(/\bdo\b/g,"<span class='keyword'>do</span>");
	code = code.replace(/\bvar\b/g,"<span class='keyword'>var</span>");
	code = code.replace(/\bnew\b/g,"<span class='keyword'>new</span>");
	code = code.replace(/\bfor\b/g,"<span class='keyword'>for</span>");
	code = code.replace(/\btry\b/g,"<span class='keyword'>try</span>");
	code = code.replace(/\belse\b/g,"<span class='keyword'>else</span>");
	code = code.replace(/\bcase\b/g,"<span class='keyword'>case</span>");
	code = code.replace(/\bthis\b/g,"<span class='keyword'>this</span>");
	code = code.replace(/\bvoid\b/g,"<span class='keyword'>void</span>");
	code = code.replace(/\bwith\b/g,"<span class='keyword'>with</span>");
	code = code.replace(/\benum\b/g,"<span class='keyword'>enum</span>");
	code = code.replace(/\btrue\b/g,"<span class='keyword'>true</span>");
	code = code.replace(/\bnull\b/g,"<span class='keyword'>null</span>");
	code = code.replace(/\bsuper\b/g,"<span class='keyword'>super</span>");
	code = code.replace(/\bfalse\b/g,"<span class='keyword'>false</span>");
	code = code.replace(/\bcatch\b/g,"<span class='keyword'>catch</span>");
	code = code.replace(/\bthrow\b/g,"<span class='keyword'>throw</span>");
	code = code.replace(/\bwhile\b/g,"<span class='keyword'>while</span>");
	code = code.replace(/\bbreak\b/g,"<span class='keyword'>break</span>");
	code = code.replace(/\breturn\b/g,"<span class='keyword'>return</span>");
	code = code.replace(/\btypeof\b/g,"<span class='keyword'>typeof</span>");
	code = code.replace(/\bswitch\b/g,"<span class='keyword'>switch</span>");
	code = code.replace(/\bdelete\b/g,"<span class='keyword'>delete</span>");
	code = code.replace(/\bexport\b/g,"<span class='keyword'>export</span>");
	code = code.replace(/\bimport\b/g,"<span class='keyword'>import</span>");
	code = code.replace(/\bextends\b/g,"<span class='keyword'>extends</span>");
	code = code.replace(/\bdefault\b/g,"<span class='keyword'>default</span>");
	code = code.replace(/\bfinally\b/g,"<span class='keyword'>finally</span>");
	code = code.replace(/\bdebugger\b/g,"<span class='keyword'>debugger</span>");
	code = code.replace(/\bfunction\b/g,"<span class='keyword'>function</span>");
	code = code.replace(/\bcontinue\b/g,"<span class='keyword'>continue</span>");
	code = code.replace(/\binstanceof\b/g,"<span class='keyword'>instanceof</span>");
	
	code = code.makeSpan(/\bclass\b/g,"class"); // this reserved word requires makeSpan
	
	// Use makeSpan on... 
	code = code.makeSpan(/(?:^|\n|[^\s\w\/\\])\s*(\/(?:<.*?>|\\\/|[^\/\*\n])(?:<.*?>|\\\/|[^\/\n])*\/)/g,
		"regexp",true,1); // RegExp literals,
	
	code = code.makeSpan(/'(?:<.*?>|\\'|[^\n'$])*(?:'|\n|$)|"(?:<.*?>|\\"|[^\n"$])*(?:"|\n|$)/g,
		"quote",true); // string literals,
		
	code = code.makeSpan(/\/\/.*
	/g,"comment",true); // comments,
	code = code.makeSpan(/\/\*[\s\S]*?(?:$|\*\/)|\*\//g,"comment",true); // multi-line comments,
	
	code = code.makeSpan(/\b\d+\b/g,"number"); // and numeric literals.
	
	// mark up function declarations for use with the function selector:
	code = code.makeSpan(/\bfunction<.*?>\s+([\$A-Za-z_][$\w]*)(?=\s*\()/g,"funcName",false,1);
	code = code.makeSpan(/[\$A-Za-z_][\$\w]*(?:\s*\.\s*[\$A-Za-z_][$\w]*|\s*\[[^\]]+\])*(?=\s*\=\s*<.*?>function<.*?>\s*\()/g,
		"funcName");
	
	editor.innerHTML = code;
	
	var funcs = document.getElementsByClassName("funcName"), ops = "", i;
	for (i=0;i<funcs.length;i++){
		ops += "<li onclick='selectFunc(event);'>" + funcs[i].innerHTML + "</li>";
		funcs[i].id = i;
	}
	document.getElementById("funcOps").innerHTML = ops;
	
	if (sel && (sel.start||sel.end)) restoreSelection(editor,sel);
}
*/