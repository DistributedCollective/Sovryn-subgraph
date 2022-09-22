red=`tput setaf 1`
yellow=`tput setaf 3`
green=`tput setaf 2`
reset=`tput sgr0`

schema_filename=schema.graphql
apollo_schema_filename=schema.apollo.graphql

echo "Preparing schema for ${green}Apollo Studio${reset}" && echo;
[ -f $apollo_schema_filename ] && rm $apollo_schema_filename;
echo "Check if ${green}$schema_filename${reset} exists" && echo;
if [ ! -f "schema.graphql" ]; then
    echo "❌ ${red}Error:${reset} $schema_filename file does not exist - please create it (did you run ${green}npm run prepare:RSK:mainnet${reset}?)" && exit 1;
fi

echo "Copying $schema_filename to $apollo_schema_filename" && echo;
cp $schema_filename $apollo_schema_filename

echo "Replacing all BigInt, BigDecimal and Bytes occurrences to String" && echo;
sed -i "s/BigInt/String/" $apollo_schema_filename
sed -i "s/BigDecimal/String/" $apollo_schema_filename
sed -i "s/Bytes/String/" $apollo_schema_filename

echo "Publishing to Apollo Studio" && echo;
npx rover graph publish My-Graph-kndzqh@latest \
  --schema ./$apollo_schema_filename

