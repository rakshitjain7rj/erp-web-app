@echo off
echo Verifying select component changes...
echo.

cd %~dp0
node -e "const fs=require('fs');const p=require('path');const s=p.join(__dirname,'erp-frontend','src','components','ui','select.tsx');const c=fs.readFileSync(s,'utf8');console.log('Has dark:hover:bg-gray-600: '+(c.includes('dark:hover:bg-gray-600')?'Yes':'No'));console.log('Has dark:bg-gray-800: '+(c.includes('dark:bg-gray-800')?'Yes':'No'));const page=p.join(__dirname,'erp-frontend','src','pages','ASUUnit1Page.tsx');const pc=fs.readFileSync(page,'utf8');console.log('Uses simplified trigger: '+(!pc.includes('dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200')?'Yes':'No'));"

echo.
echo Check complete.
pause
