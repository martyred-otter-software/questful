@echo off
setlocal enabledelayedexpansion
for /L %%i in (0,1,7) do (
	for /L %%j in (0,1,7) do (
		copy exRfV.bmp %%i%%j.bmp
		set /A x=%%i*100+14
		set /A y=%%j*100+36
		echo !x!
		echo !y!
		"C:\Program Files\ImageMagick-7.0.10-Q16-HDRI\magick.exe" mogrify -crop 64x64+!x!+!y! %%i%%j.bmp
	)
)