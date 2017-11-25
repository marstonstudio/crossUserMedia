Tomcat HTTPS

https://dzone.com/articles/setting-ssl-tomcat-5-minutes

CATALINA_HOME=/usr/local/Cellar/tomcat/8.5.23/libexec

keytool -genkey -alias tomcat -keyalg RSA -keystore crossUserMedia/assets/java/keystore

Enter keystore password:                            changeit
What is your first and last name?                   microphone.marstonstudio.com
What is the name of your organizational unit?       Engineering
What is the name of your organization?              Marston Development Studio
What is the name of your City or Locality?          Manchester
What is the name of your State or Province?         MA
What is the two-letter country code for this unit?  US

emacs $CATALINA_HOME/conf/server.xml

replace
    <!--
    <Connector port="8443" protocol="org.apache.coyote.http11.Http11NioProtocol"
               maxThreads="150" SSLEnabled="true">
        <SSLHostConfig>
            <Certificate certificateKeystoreFile="conf/localhost-rsa.jks"
                         type="RSA" />
        </SSLHostConfig>
    </Connector>
    -->

with

    <Connector port="8443" protocol="org.apache.coyote.http11.Http11NioProtocol"
               maxThreads="150" SSLEnabled="true" scheme="https" secure="true"
               clientAuth="false" sslProtocol="TLS"
               keystoreFile="crossUserMedia/assets/java/keystore" keystorePass="changeit" />
