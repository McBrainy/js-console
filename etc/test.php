<!DOCTYPE html>
<html>
	<head>
		<title>test</title>
		<script src="codemirror/lib/codemirror.js"></script>
		<script src="codemirror/mode/javascript/javascript.js"></script>
		<link rel="stylesheet" href="codemirror/lib/codemirror.css">
<?php
	//ini_set('display_errors','on');
	
	$themes = array();
	
	function write_styles($path)
	{
		$dir = opendir('.');
		$file = readdir($dir);
		
		//print_r($_GLOBALS['themes']);
		
		while ($file) {
			if (preg_match('/\./',$file) && !preg_match('/^\./',$file)) {
				# filename has a "." but doesn't start with a
				# ".", so assume it's a stylesheet
				echo "<link rel='stylesheet' href='$path$file' />\n";
				array_push($GLOBALS['themes'],preg_replace('/\.css/','',$file));
			}
			$file = readdir($dir);
		}
	}
	
	chdir('codemirror/theme');
	write_styles('codemirror/theme/');
?>
		<script>
			window.onload = function() {
				var theme = "<?php echo $themes[intval($_GET['theme'])]; ?>";
				CodeMirror(document.body,{
					value:"function main() {\n\t// Your code here\n}\n",
					indentWithTabs:true,
					indentUnit:4,
					lineNumbers:true,
					theme:theme
				});
			}
		</script>
	</head>
	<body style="background-color:black;color:white;">
		<?php echo $themes[intval($_GET['theme'])]; ?>
	</body>
</html>
