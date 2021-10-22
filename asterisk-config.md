# Configuração inicial do Asterisk <h1>

1. # Configurar Horario da Máquina <h4>
* CMD
`timedatectl set-timezone America/Sao_Paulo` 



2. # Configurar conexao odbc<h4>
* Editar os arquivos:
1. /etc/odbc.ini
~~~ini
[nomedaconexaoodbc]
Description = Descricao
Driver      = MariaDB
Database    = database
Server      = server
Port        = 3306
Password    = password
~~~

2. /etc/odbcinst.ini
~~~ini
[MariaDB]
Description = Descricao da Conexao
Driver      = /usr/lib64/libmaodbc.so
Setup       = /usr/lib64/libodbcmyS.so
UsageCount  = 1
FileUsage   = 1
~~~

3. /etc/asterisk/func_odbc.conf
>Edite os seguintes blocos de codigo:
~~~conf
[SQL]
dsn=nomedaconexaoodbc
readsql=${ARG1}

[ANTISOLICIT]
dsn=nomedaconexaoodbc,mysql2
readsql=SELECT COUNT(*) FROM known_solicitors WHERE callerid='${SQL_ESC(${ARG1})}'
syntax=<callerid>
synopsis=Check if a specified callerid is contained in the known solicitors database

[PRESENCE]
dsn=nomedaconexaoodbc
readsql=SELECT location FROM presence WHERE id='${SQL_ESC(${ARG1})}'
writesql=UPDATE presence SET location='${SQL_ESC(${VAL1})}' WHERE id='${SQL_ESC(${ARG1})}'

[TESTESQL]
~~~

4./etc/asterisk/res_odbc.conf
~~~conf
[nomedaconexaoodbc]
enabled => yes
dsn => nomedaconexaoodbc
username => userDB
password => passDB
pre-connect => yes
~~~


3. # Configurar o CDR<h4>
* Editar o arquivo:
1. /etc/asterisk/cdr.conf
>Edite o arquivo **cdr.conf** adicionando o seguinte bloco de codigo:
~~~conf
[mysql]
usegmtime=yes    
loguniqueid=yes  
loguserfield=yes 
accountlogs=yes 
~~~

4. # Configurar CDR ODBC<h4>
* Editar o arquivo:
1. /etc/asterisk/cdr_odbc.conf
~~~conf
[global]
dsn=nomedaconexaoodbc
loguniqueid=yes
dispositionstring=yes
table=cdr		;"cdr" is default table name
usegmtime=yes             ; set to "yes" to log in GMT
hrtime=yes		;Enables microsecond accuracy with the billsec and duration fields
newcdrcolumns=yes ; Enable logging of post-1.8 CDR columns (peeraccount, linkedid, sequence)
timezone=UTC
~~~



5. # Habilitando o relatório de eventos **CEL**<H4>
* Edite os arquivos:
1. /etc/asterisk/cel.conf
>Descomente a linha a seguir dentro do contesto ```[general]```
~~~conf
enable=yes
~~~
>Descomente a linha a seguir dentro do contesto ```[manager]```
~~~conf
enable=yes
~~~

2./etc/asterisk/cel_odbc.conf
>Descomente e edite o seguinte bloco:
~~~conf
[first]
connection=nomedaconexaoodbc
table=cel
~~~



6. # Configurar agente ari<h4>
* Editar o arquivo:
1. /etc/asterisk/ari.conf
~~~conf
[username]
enabled = yes       ; When set to no, ARI support is disabled.
pretty = yes        ; When set to yes, responses from ARI are

[mega-user-ari]
type = user        ; Specifies user configuration
read_only = no     ; When set to yes, user is only authorized for
password = 1234abc@ 
~~~



7. # Configurar manager<h4>
* Editar o arquivo:
1. /etc/asterisk/manager.conf
~~~conf
[general]
enabled = yes
webenabled = yes

port = 5038
bindaddr = 0.0.0.0

[username]
secret = password
;deny=0.0.0.0/0.0.0.0
permit=0.0.0.0/0.0.0.0
;permit=209.16.236.73/255.255.255.0
~~~

8. # Configure os módulos do asterisk manager
* Edite o arquivo:
1. /etc/asterisk/modules.conf
~~~conf
[modules]
preload => res_odbc.so
preload => res_config_odbc.so
autoload=yes

noload => chan_alsa.so
;noload => chan_oss.so
noload => chan_console.so

noload => res_hep.so
noload => res_hep_pjsip.so
noload => res_hep_rtcp.so

noload => cdr_mysql.so
noload => cdr_csv.so
noload => cdr_custom.so
noload => cdr_sqlite3_custom.so
noload => cdr_pgsql.so
noload => cel_sqlite3_custom.so
noload => chan_sip.so
~~~


9. # Configure o PJSIP
* Edite o arquivo:
1. /etc/asterisk/pjsip.conf
~~~conf
;=======================TRANSPORTS============================================
; WSS transport
[transport-wss]
type=transport
protocol=wss    ;udp,tcp,tls,ws,wss
bind=0.0.0.0
async_operations=1
allow_reload=yes
symmetric_transport=no
; UDP transport behind NAT
[transport-udp]
type=transport
protocol=udp
bind=0.0.0.0:port
local_net=local_net
external_media_address=ip_publico
external_signaling_address=ip_publico
;=====================REGISTER===================================================
[nome_tronco]
type=registration
transport=transport-udp
outbound_auth=megatrunk_auth
server_uri=sip:username@ip_tronco:port
client_uri=sip:username@35.ip_tronco.98.221.port
retry_interval=60
;forbidden_retry_interval=600
;expiration=3600
line=yes
endpoint=nome_tronco

[megatrunk_auth]
type=auth
auth_type=userpass
password=password
username=username
;realm=sip.example.com

[nome_tronco]
type=endpoint
;transport=transport-udp
context=default
disallow=all
allow=ulaw,alaw,g729,opus
outbound_auth=nome_tronco_auth
aors=nome_tronco
;                   ;A few NAT relevant options that may come in handy.
;force_rport=yes    ;It's a good idea to read the configuration help for each
;direct_media=no    ;of these options.
;ice_support=yes

[nome_tronco]
type=aor
contact=sip:ip_tronco.porta

[nome_tronco]
type=identify
endpoint=nome_tronco
match=ip_tronco
~~~


10. # Configure as filas
* Editar o arquivos:
1. /etc/asterisk/queues.conf
>Descomente e configure as seguintes linhas
~~~conf
[general]
persistentmembers = yes
autofill          = yes
monitor-type      = MixMonitor
shared_lastcall   = yes
~~~



11. # Configurar sorcery<h4>
* Editar o arquivos:
1. /etc/asterisk/extconfig.conf
>Descomente e configure as seguintes linhas
~~~conf
ps_endpoints => odbc,nomedaconexaoodbc,ps_endpoints
ps_auths => odbc,nomedaconexaoodbc,ps_auths
ps_aors => odbc,nomedaconexaoodbc
ps_domain_aliases => odbc,nomedaconexaoodbc,ps_domain_aliases
ps_endpoint_id_ips => odbc,nomedaconexaoodbc,ps_endpoint_id_ips
ps_contacts => odbc,nomedaconexaoodbc,ps_contacts

queues => odbc,nomedaconexaoodbc,queues
queue_members => odbc,nomedaconexaoodbc,queue_members
queue_rules => odbc,nomedaconexaoodbc,queue_rules
~~~

2. /etc/asterisk/sorcery.conf
~~~conf
[test_sorcery_section]
test=memory

[test_sorcery_cache]
test/cache=test
test=memory

[res_pjsip] ; Realtime PJSIP configuration wizard
endpoint=realtime,ps_endpoints
endpoint=config,pjsip.conf,criteria=type=endpoint
auth=realtime,ps_auths
auth=config,pjsip.conf,criteria=type=auth
aor=realtime,ps_aors
aor=config,pjsip.conf,criteria=type=aor
domain_alias=realtime,ps_domain_aliases
;domain_alias=config,pjsip.conf,criteria=type=domain_alias
contact=realtime,ps_contacts
;contact=astdb,registrator
queues=realtime,ps_domain_aliases
queues=config,queues.conf,criteria=type=queues
queue_members => realtime,ps_domain_aliases

global=config,pjsip.conf,criteria=type=global
system=config,pjsip.conf,criteria=type=system
transport=config,pjsip.conf,criteria=type=transport
 
[res_pjsip_endpoint_identifier_ip]
identify=realtime,ps_endpoint_id_ips
~~~



12. # Configure o rtp<h4>
* Editar o arquivos:
1. /etc/asterisk/rtp.conf
~~~conf
[general]
rtpstart=10000
rtpend=20000
icesupport=true
stunaddr=stun.l.google.com:19302

[ice_host_candidates]
~~~



13. # Habilitar https<h4>
* Crie um subdominio e aponte seu dns para o ip do asterisk

*Remova a configuracao anterior do letsencrypt 

*Edite os arquivos:
1. /etc/httpd/conf/httpd.conf
Subistitua o DOMINIO.COM pelo dominio real
~~~md
ServerRoot "/etc/httpd"
Listen 80
Include conf.modules.d/*.conf
User apache
Group apache
<VirtualHost *:80 />
	ServerName DOMINIO.COM
	ServerAlias DOMINIO.COM
	DocumentRoot /var/www/DOMINIO.COM
	ErrorLog /etc/httpd/logs/error_log
	CustomLog /etc/httpd/logs/access_log combined
RewriteEngine on
RewriteCond %{SERVER_NAME} =DOMINIO.COM
RewriteRule ^ https://%{SERVER_NAME}%{REQUEST_URI} [END,NE,R=permanent]
</VirtualHost>
ServerAdmin root@localhost
<Directory />
    AllowOverride none
    Require all denied
</Directory>
DocumentRoot "/var/www/html"
<Directory "/var/www">
    AllowOverride None
    Require all granted
</Directory>
<Directory "/var/www/html">
    Options Indexes FollowSymLinks
    AllowOverride None
    Require all granted
</Directory>
<IfModule dir_module>
    DirectoryIndex index.html
</IfModule>
<Files ".ht*">
    Require all denied
</Files>
ErrorLog "logs/error_log"
LogLevel warn
<IfModule log_config_module>
    LogFormat "%h %l %u %t \"%r\" %>s %b \"%{Referer}i\" \"%{User-Agent}i\"" combined
    LogFormat "%h %l %u %t \"%r\" %>s %b" common
    <IfModule logio_module>
      LogFormat "%h %l %u %t \"%r\" %>s %b \"%{Referer}i\" \"%{User-Agent}i\" %I %O" combinedio
    </IfModule>
    CustomLog "logs/access_log" combined
</IfModule>
<IfModule alias_module>
    ScriptAlias /cgi-bin/ "/var/www/cgi-bin/"
</IfModule>
<Directory "/var/www/cgi-bin">
    AllowOverride None
    Options None
    Require all granted
</Directory>
<IfModule mime_module>
    TypesConfig /etc/mime.types
    AddType application/x-compress .Z
    AddType application/x-gzip .gz .tgz
    AddType text/html .shtml
    AddOutputFilter INCLUDES .shtml
</IfModule>
AddDefaultCharset UTF-8
<IfModule mime_magic_module>   
    MIMEMagicFile conf/magic
</IfModule>
EnableSendfile on
IncludeOptional conf.d/*.conf
Include /etc/httpd/conf/httpd-le-ssl.conf

~~~


2. /etc/httpd/conf/httpd-le-ssl.conf
Subistitua o DOMINIO.COM pelo dominio real
~~~md
<IfModule mod_ssl.c>
<VirtualHost *:443 /:443>
	ServerName DOMINIO.COM
	ServerAlias DOMINIO.COM
	DocumentRoot /var/www/DOMINIO.COM
	ErrorLog /etc/httpd/logs/error_log
	CustomLog /etc/httpd/logs/access_log combined
SSLCertificateFile /etc/letsencrypt/live/DOMINIO.COM/cert.pem
SSLCertificateKeyFile /etc/letsencrypt/live/DOMINIO.COM/privkey.pem
Include /etc/letsencrypt/options-ssl-apache.conf
SSLCertificateChainFile /etc/letsencrypt/live/DOMINIO.COM/chain.pem
</VirtualHost>
</IfModule>
~~~



* Instalação do SNAPD:
1. Adicionando reposiório EPEL
```$ sudo yum -y install epel-release```

2. Instalando o snapd
```$ sudo yum -y install snapd```

3. Habilitando unidade sistematacional que gerencia o soquete principal comunicação snap
```$ sudo systemctl enable --now snapd.socket```

4. Habilitando suporte Clássico
```$ sudo ln -s /var/lib/snapd/snap /snap```

5. Reinicie o sistema
```$ reboot```

6. Verifique se a versao do snap esta atualizada
```$ sudo snap install core; sudo snap refresh core```


* Instale o Certbot
1. Execute o comando de instalação
```$ sudo snap install --classic certbot```

2. Prepare o comando do Certbot 
```$ sudo ln -s /snap/bin/certbot /usr/bin/certbot```

3. Execute o certbot
```$ sudo certbot certonly --standalone```

4. Teste a renovação automática do certificado
```$ sudo sh -c 'printf "#!/bin/sh\nservice haproxy stop\n" > /etc/letsencrypt/renewal-hooks/pre/haproxy.sh'```$ 
```$ 
'```$ 
```$ sudo chmod 755 /etc/letsencrypt/renewal-hooks/pre/haproxy.sh```$ 
```$ sudo chmod 755 /etc/letsencrypt/renewal-hooks/post/haproxy.sh```$ 
```$ sudo certbot renew --dry-run```


14. # Configurar http<h4>
* Editar o arquivo:
1. /etc/asterisk/http.conf
~~~conf
; Asterisk Built-in mini-HTTP server
[general]
servername=asterisk
enabled=yes
bindaddr=0.0.0.0
bindport=8088

tlsenable=yes          ; enable tls - default no.
tlsbindaddr=0.0.0.0:8089    ; address and port to bind to - default is bindaddr and port 8089.

tlscertfile=/etc/letsencrypt/live/dominio/cert.pem
tlsprivatekey=/etc/letsencrypt/live/dominio/privkey.pem
~~~
