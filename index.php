<?php

ini_set('display_errors','on');

session_start();

require_once('FirePHPCore/FirePHP.class.php');
require_once('FirePHPCore/fb.php');

if ($_SERVER['REQUEST_METHOD'] == 'POST' && isset($_POST['m'])) {
	/*
	 * Handles login, password changes, and anything else
	 * submitted via POST requests to this page.
	 */

	function check($user, $pass) {
		$tmp = file_get_contents("../users/$user/passwd");
		$salt = substr($tmp,0,8); // separate salt from hash
		$hash = substr($tmp,8);
		return crypt($pass, $salt) == $hash;
	}

	if ($_POST['m'] === 'n' && isset($_POST['u'])) { // new account request
		if (!file_exists("../users/$_POST[u]")) { // username is not taken
			if (!mkdir("../users/$_POST[u]")) {
				header('Success: n');
				echo 'An unknown error occurred.';
			}
			else {
				header('Success: y');
			}
		}
		exit;
	}

	if ($_POST['m'] === 'l' && isset($_POST['u'])) // somebody's trying to log in
	{
		$username = strtolower($_POST['u']); // make username case-insensitive
		if (file_exists("../users/$username")) // username is valid
		{
			if (isset($_POST['p'])) // a password was supplied
			{
				if (check($username, $_POST['p'])) // password is correct
				{
					$_SESSION['user'] = $username; // log in
					header('Success: y'); // yes, logged in
					echo "Successfully connected as $username.";
				}
			}
			else echo 'y'; // yes, valid username
		}
		exit;
	}

	if (isset($_POST['p']) && isset($_POST['np'])) // password change request
	{
		if (isset($_SESSION['user']) && check($_SESSION['user'], $_POST['p']))
		{
			$salt = substr(str_shuffle("abcdefghijklmnopqrstuvwxyz0123456789"), 0, 8);
			$hash = crypt($_POST['np'], $salt);
			file_put_contents("../users/$_POST[u]/passwd", $salt . $hash, LOCK_EX);
			header('Success: y');
			echo 'Password successfully changed.';
		}
		else echo 'Password is incorrect.';
		exit;
	}
}

?>
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
<?php

/*
 * Creates an inline JavaScript that runs all 'cmd[]=' url params
 */

$script = '';

if (isset($_GET['cmd'])) {
	if (is_array($_GET['cmd'])) { // multiple commands passed
		array_walk($_GET['cmd'],'addslashes'); // escape code
		foreach ($_GET['cmd'] as $cmd) {
			$script .= "showCode('$cmd');";
		}
	}
	else {
		$cmd = addslashes($_GET['cmd']); // escape code
		fb($cmd);
		$script .= "showCode('$cmd');";
	}
}

if ($script !== '') {
	echo '<script>window.addEventListener("load",function(){', $script, '});</script>';
}

?>
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
