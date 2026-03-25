@echo off
echo ==========================================
echo Fixing CSS Warnings for Tailwind
echo ==========================================
echo.

echo Installing Tailwind CSS IntelliSense extension...
echo Please install manually from VS Code Extensions
echo.

echo Creating VS Code settings...
if not exist ".vscode" mkdir .vscode

(
echo {
echo   "css.validate": false,
echo   "scss.validate": false,
echo   "less.validate": false,
echo   "tailwindCSS.emmetCompletions": true,
echo   "tailwindCSS.includeLanguages": {
echo     "typescript": "javascript",
echo     "typescriptreact": "javascript"
echo   },
echo   "editor.quickSuggestions": {
echo     "strings": true
echo   },
echo   "files.associations": {
echo     "*.css": "tailwindcss"
echo   }
echo }
) > .vscode\settings.json

echo.
echo ==========================================
echo Settings created successfully!
echo ==========================================
echo.
echo Please restart VS Code for changes to take effect.
echo.
pause
