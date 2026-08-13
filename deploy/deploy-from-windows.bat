@echo off
setlocal
set SERVER=root@164.92.128.216
set ROOT=%~dp0..
set ARCHIVE=%TEMP%\video-planner-deploy.tgz

echo Creating deployment archive...
cd /d "%ROOT%"
tar --exclude=node_modules --exclude=.next --exclude=data/videoplanner.db --exclude=.env.local -czf "%ARCHIVE%" .

echo Uploading to server...
scp "%ARCHIVE%" %SERVER%:/tmp/video-planner-deploy.tgz

echo Extracting and deploying on server...
ssh %SERVER% "bash -s" < "%~dp0remote-deploy.sh"

echo Done.
