# ICGC DCC - Portal API

RESTful API for the ICGC DCC Data Portal. 

## Documentation

Technical Documentation: [API.md](./API.md)

Executable API documentation is available at:

	http://localhost:8080/docs

## Administration

Administration is available at:

	http://localhost:8081
  
## Development

The Portal API is built with maven:

```shell
cd dcc-portal/dcc-portal-api
mvn -am
```

To run from the command line without packaging into a jar:

```shell
cd dcc-portal-api
mvn exec:java -Dexec.args="server path/to/settings.yml"
```

## Configuration

To configure the portal for running, the `elastic` and `icgc` portions of the `settings.yml` file
to be used must be set.

The `elastic` portion of the configuration must point to an existing and running elasticsearch index. 

For the `icgc` portion, the API endpoints and credentials must be configured. You must provide substitutes to any
ICGC systems and APIs you do not have access to should that case arise, such as your own Centralized User Directory. 

## Deployment

To run the application once built:

```shell
cd dcc-portal/dcc-portal-api
java -jar target/dcc-portal-api-[version].jar server src/test/conf/settings.yml
``` 
  
## Keystore Management

To import certs generated from letsencrypt:
 

```shell
# Create new letsencrypt.jks keystore
openssl pkcs12 -export -in cert.pem -inkey privkey.pem -out cert_and_key.p12 -name tomcat -CAfile chain.pem -caname root
keytool -importkeystore -deststorepass password -destkeypass password -destkeystore letsencrypt.jks -srckeystore cert_and_key.p12 -srcstoretype PKCS12 -srcstorepass password -alias tomcat
```
Based from: [gist](https://gist.github.com/mihkels/6e30e8e21acc68a55482#file-letsencrypt-sh-L9-L12)
