npm install -d
cd ./node_modules/hoard
npm install -d
coffee -c -l -b -o lib src
cd ../../
generateGrammars.bat
runTests.bat

