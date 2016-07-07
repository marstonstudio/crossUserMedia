Tomcat HTTPS

https://dzone.com/articles/setting-ssl-tomcat-5-minutes

CATALINA_HOME=/usr/local/Cellar/tomcat/8.0.35/libexec

keytool -genkey -alias tomcat -keyalg RSA -keystore $CATALINA_HOME/conf/keystore

Enter keystore password:                            changeit
What is your first and last name?                   www.localenglishcentral.com
What is the name of your organizational unit?       Engineering
What is the name of your organization?              EnglishCentral
What is the name of your City or Locality?          Arlington
What is the name of your State or Province?         MA
What is the two-letter country code for this unit?  US

emacs $CATALINA_HOME/conf/server.xml

replace
    <!--
    <Connector port="8443" protocol="org.apache.coyote.http11.Http11NioProtocol"
               maxThreads="150" SSLEnabled="true" scheme="https" secure="true"
               clientAuth="false" sslProtocol="TLS" />
    -->

with

    <Connector port="8443" protocol="org.apache.coyote.http11.Http11NioProtocol"
               maxThreads="150" SSLEnabled="true" scheme="https" secure="true"
               clientAuth="false" sslProtocol="TLS"
               keystoreFile="conf/keystore" keystorePass="changeit" />
