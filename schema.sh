# This script concatenates all the files in the schema directory into the schema.graphql file
rm schema.graphql && for f in schema/*.graphql; do (cat "${f}"; echo; echo) >> schema.graphql;
red=`tput setaf 1`
yellow=`tput setaf 3`
green=`tput setaf 2`
reset=`tput sgr0`
echo "${green}✔ ${reset}Schema for ${yellow}$f${reset} has been written to schema.graphql";
done