<!DOCTYPE html>
<html>
	<head>
		<title>JavaScript Console</title>
		<link rel="icon" type="image/x-icon" href="favicon.ico?v=8" />

		<meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
		<meta name="description" content="A command-line environment for learning and testing JavaScript code." />
		<meta name="google" content="notranslate" />

		<link rel="stylesheet" type="text/css" href="JavaScriptStyles.css" />

		<script src="jquery.min.js"></script>

		<script src="codemirror/codemirror.js"></script>
		<script src="codemirror/javascript.js"></script>
		<link rel="stylesheet" href="codemirror/codemirror.css" />
		<link rel='stylesheet' href='codemirror/ambiance.css' />

		<script src="JavaScriptConsole.js"></script>
	</head>
	<body spellcheck="false">
		<div id="header">JavaScript Console</div>
		<div id="consoleWrapper">
			<div id='card'>
				<div id='back' style='display:none;'>
					<div id="info-text">
						version 0.1.1<br />
						by Brian McCutchon<br />
						original design by Matthew I. Kennel<br />
						with CodeMirror editor<br />
					</div>
					<input type='button' id='done' value='done' />
				</div>
				<div id="console">
					<div id="top-left" class="top left corner cell"></div>
					<div id="top" class="top vert-middle cell"></div>
					<div id="top-right" class="top right corner cell"></div>
					<div id="left" class="left horiz-middle cell"></div>
					<div id="OutputWindow" class="horiz-middle vert-middle cell">
						<pre id="OutputText"><?php if (isset($_SESSION['user'])) {echo "<div>Connected as $_SESSION[user].</div>";} ?></pre>
						<noscript>
							Your browser does not support javascript,
							or javascript is turned off.
							Please turn on javascript in your browser's preferences,
							or upgrade to a modern browser, such as
							<a href="www.mozilla.org/en-US/firefox/new/">Firefox</a>.
						</noscript>
					</div>
					<div id="right" class="right horiz-middle cell"></div>
					<div id="bottom-left" class="bottom left corner cell"></div>
					<div id="bottom" class="bottom vert-middle cell"></div>
					<div id="bottom-right" class="bottom right corner cell">
						<img src='data:image/gif;base64,R0lGODlhDAAMAKEBAAAAAP///////////yH5BAEKAAIALAAAAAAMAAwAAAITjI9pAIrsomJNQlvj1dlt/0lHAQA7'
							id='info-icon' style='display:none;' title='info()' />
					</div>
				</div>
			</div>
		</div>
		<div id="editor" style="display:none;">
			<div id="funcSelect">Jump to function:<ul id="funcOps"></ul></div>
		</div>
	</body>
</html>
