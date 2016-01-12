<?php

if (isset($_POST['filename']) && $_POST['filename']) {
	$filename = $_POST['filename'];
}
else {
	$filename = 'myAwesomeScript.js';
}

header("Content-type: application/javascript");
header("Content-Disposition: attachment; filename=$filename");
header("Pragma: no-cache");
header("Expires: 0");

echo $_POST['content'];
