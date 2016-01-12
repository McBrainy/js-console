<!DOCTYPE html>
<html>
<head>
	<title>JS Editor <?php echo $_GET['n']; ?></title>
	<meta name="google" content="notranslate" />
	<meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
	<meta name="robots" content="noindex, nofollow" />
	<link rel="icon" type="image/x-icon" href="favicon.ico" />
	<link rel="stylesheet" type="text/css" href="ColorStyles.css" />
	<script src="EditorControl.js"></script>
</head>
<body spellcheck="false" style="background-color:black;" onload="syntax();">
	<select id="funcSelect" onchange="selectFunc(event);" 
		style="position:fixed;top:2px;right:2px;"></select>
	<pre id="syntaxEditor" contentEditable="true" spellcheck="false"
	onkeydown="keydown(event);" onkeyup="syntax();">function primary()
{
	// Your code goes here.
}
</pre>
</body>
</html>
