# 系统环境 : ubuntu1804+
# k8s version : k8s 1.30.x
# cri containerd

### 一.K8S集群各主机环境准备

1.环境准备

    主机名	         IP地址	             角色划分	                                          硬件配置
    k8s-master01	  192.168.31.10	     api-server，control manager，scheduler，etcd	      2c，4GB，50GB+
    k8s-node01	    192.168.31.11	     kubelet，kube-proxy                               2c，4GB，50GB+
    k8s-node02	    192.168.31.12	     kubelet，kube-proxy	                             2c，4GB，50GB+
    ​
2.所有节点安装常用的软件包
apt update
apt -y install bind9-utils expect rsync jq psmisc net-tools lvm2 vim unzip rename

3.k8s-master节点免密钥登录集群并同步数据
	
1) 设置主机名,各节点参考如下命令修改即可
hostnamectl set-hostname k8s-master01

2) 设置相应的主机名及hosts文件解析
cat >> /etc/hosts <<'EOF'
192.168.31.10 k8s-master01
192.168.31.11 k8s-node01
192.168.31.12 k8s-node02
192.168.31.100 k8s-node03
192.168.31.101 k8s-node04
EOF

3) 配置免密码登录其他节点
cat > password_free_login.sh <<'EOF'
#!/bin/bash
# 创建密钥对
ssh-keygen -t rsa -P "" -f /root/.ssh/id_rsa -q

# 声明你服务器密码，建议所有节点的密码均一致，否则该脚本需要再次进行优化
export mypasswd=12345

# 定义主机列表
k8s_host_list=(k8s-master01 k8s-node01 k8s-node02)

# 配置免密登录，利用expect工具免交互输入
for i in ${k8s_host_list[@]};do
expect -c "
spawn ssh-copy-id -i /root/.ssh/id_rsa.pub root@$i
expect {
    \"*yes/no*\" {send \"yes\r\"; exp_continue}
    \"*password*\" {send \"$mypasswd\r\"; exp_continue}
}"
done
EOF

bash password_free_login.sh

4) 编写同步脚本
cat > /usr/local/sbin/data_rsync.sh <<'EOF'
#!/bin/bash

# Auther: Pillar

if  [ $# -lt 1 ];then
echo "Usage: $0 /path/to/file(绝对路径)"
exit
fi 

if [ ! -e $1 ];then
    echo "[ $1 ] dir or file not find!"
    exit
fi

fullpath=`dirname $1`

basename=`basename $1`

cd $fullpath

K8S_NODE=(k8s-node01 k8s-node02)

for host in ${K8S_NODE[@]};do
tput setaf 2
    echo ===== rsyncing ${host}: $basename =====
    tput setaf 7
    rsync -az $basename  `whoami`@${host}:$fullpath
    if [ $? -eq 0 ];then
    echo "命令执行成功!"
    fi
done
EOF

chmod +x /usr/local/sbin/data_rsync.sh

5) 同步"/etc/hosts"文件到集群
data_rsync.sh /etc/hosts 


4.所有节点Linux基础环境优化

1) 所有节点关闭ufw
systemctl disable --now ufw 

2) 所有节点关闭swap分区，fstab注释swap
swapoff -a && sysctl -w vm.swappiness=0
sed -ri '/^[^#]*swap/s@^@#@' /etc/fstab
free -h
        
3) 手动同步时区和时间
ln -svf /usr/share/zoneinfo/Asia/Shanghai /etc/localtime

4) 所有节点配置limit
cat >> /etc/security/limits.conf <<'EOF'
* soft nofile 655360
* hard nofile 131072
* soft nproc 655350
* hard nproc 655350
* soft memlock unlimited
* hard memlock unlimited
EOF

5) 所有节点优化sshd服务
sed -i 's@#UseDNS yes@UseDNS no@g' /etc/ssh/sshd_config
sed -i 's@^GSSAPIAuthentication yes@GSSAPIAuthentication no@g' /etc/ssh/sshd_config

    - UseDNS选项:
打开状态下，当客户端试图登录SSH服务器时，服务器端先根据客户端的IP地址进行DNS PTR反向查询出客户端的主机名，然后根据查询出的客户端主机名进行DNS正向A记录查询，验证与其原始IP地址是否一致，这是防止客户端欺骗的一种措施，但一般我们的是动态IP不会有PTR记录，打开这个选项不过是在白白浪费时间而已，不如将其关闭。

    - GSSAPIAuthentication:
当这个参数开启（ GSSAPIAuthentication  yes ）的时候，通过SSH登陆服务器时候会有些会很慢！这是由于服务器端启用了GSSAPI。登陆的时候客户端需要对服务器端的IP地址进行反解析，如果服务器的IP地址没有配置PTR记录，那么就容易在这里卡住了。


6) Linux内核调优
cat > /etc/sysctl.d/k8s.conf <<'EOF'

# 以下3个参数是containerd所依赖的内核参数

net.ipv4.ip_forward = 1
net.bridge.bridge-nf-call-iptables = 1
net.bridge.bridge-nf-call-ip6tables = 1
net.ipv6.conf.all.disable_ipv6 = 1
fs.may_detach_mounts = 1
vm.overcommit_memory=1
vm.panic_on_oom=0
fs.inotify.max_user_watches=89100
fs.file-max=52706963
fs.nr_open=52706963
net.netfilter.nf_conntrack_max=2310720
net.ipv4.tcp_keepalive_time = 600
net.ipv4.tcp_keepalive_probes = 3
net.ipv4.tcp_keepalive_intvl =15
net.ipv4.tcp_max_tw_buckets = 36000
net.ipv4.tcp_tw_reuse = 1
net.ipv4.tcp_max_orphans = 327680
net.ipv4.tcp_orphan_retries = 3
net.ipv4.tcp_syncookies = 1
net.ipv4.tcp_max_syn_backlog = 16384
net.ipv4.ip_conntrack_max = 65536
net.ipv4.tcp_max_syn_backlog = 16384
net.ipv4.tcp_timestamps = 0
net.core.somaxconn = 16384
EOF

sysctl --system

7) 修改终端颜色[可选]
cat <<EOF >>  ~/.bashrc 
PS1='[\[\e[34;1m\]\u@\[\e[0m\]\[\e[32;1m\]\H\[\e[0m\]\[\e[31;1m\] \W\[\e[0m\]]# '
EOF

source ~/.bashrc
        

5.所有节点安装ipvsadm以实现kube-proxy的负载均衡

1) 安装ipvsadm等相关工具
apt -y install ipvsadm ipset sysstat conntrack 

2) 所有节点创建要开机自动加载的模块配置文件
cat > /etc/modules-load.d/ipvs.conf << 'EOF'
ip_vs
ip_vs_lc
ip_vs_wlc
ip_vs_rr
ip_vs_wrr
ip_vs_lblc
ip_vs_lblcr
ip_vs_dh
ip_vs_sh
ip_vs_fo
ip_vs_nq
ip_vs_sed
ip_vs_ftp
ip_vs_sh
nf_conntrack
ip_tables
ip_set
xt_set
ipt_set
ipt_rpfilter
ipt_REJECT
ipip
EOF

3) 修改ens33网卡名称为eth0【选做，建议修改】
3.1 修改配置文件
vim /etc/default/grub
...
GRUB_CMDLINE_LINUX="... net.ifnames=0 biosdevname=0"

3.2 用grub2-mkconfig重新生成配置 
grub-mkconfig -o /boot/grub/grub.cfg 

3.3 修改网卡配置
vim /etc/netplan/00-installer-config.yaml
    network:
    ethernets:
        eth0:
        dhcp4: false
        addresses:
            - 192.168.31.10/24
        routes:
            - to: default
            via: 10.0.0.254
        nameservers:
            addresses:
                # 114 DNS
            - 114.114.114.114
            - 114.114.115.115
                # 阿里云DNS
            - 223.5.5.5
            - 223.6.6.6
                # 腾讯云DNS
            - 119.29.29.29
            - 119.28.28.28
                # 百度DNS
            - 180.76.76.76
                # Google DNS
            - 8.8.8.8
            - 4.4.4.4
    version: 2

4) 重启操作系统即可
reboot 

5) 验证加载的模块
lsmod | grep --color=auto -e ip_vs -e nf_conntrack
uname -r
ifconfig

温馨提示:Linux kernel 4.19+版本已经将之前的"nf_conntrack_ipv4"模块更名为"nf_conntrack"模块哟~


### 二.安装containerd组件

1.安装必要的一些系统工具
apt-get -y install apt-transport-https ca-certificates curl software-properties-common

2.安装GPG证书
curl -fsSL https://mirrors.aliyun.com/docker-ce/linux/ubuntu/gpg | apt-key add -

3.写入软件源信息
add-apt-repository "deb [arch=arm64] https://mirrors.aliyun.com/docker-ce/linux/ubuntu $(lsb_release -cs) stable"

4.更新软件源
apt-get update

5.安装containerd组件
apt-get -y install containerd.io

6.配置containerd需要的模块
1) 临时手动加载模块
modprobe -- overlay
modprobe -- br_netfilter

2) 开机自动加载所需的内核模块
cat > /etc/modules-load.d/containerd.conf <<EOF
overlay
br_netfilter
EOF

7.修改containerd的配置文件
1) 重新初始化containerd的配置文件
containerd config default | tee /etc/containerd/config.toml 

2) 修改Cgroup的管理者为systemd组件
sed -ri 's#(SystemdCgroup = )false#\1true#' /etc/containerd/config.toml 
grep SystemdCgroup /etc/containerd/config.toml

3) 修改pause的基础镜像名称
sed -i 's#registry.k8s.io/pause:3.6#registry.cn-hangzhou.aliyuncs.com/google_containers/pause:3.8#' /etc/containerd/config.toml
grep sandbox_image /etc/containerd/config.toml

8.所有节点启动containerd
1) 启动containerd服务
systemctl daemon-reload
systemctl enable --now containerd
systemctl status containerd

2) 配置crictl客户端连接的运行时位置
cat > /etc/crictl.yaml <<EOF
runtime-endpoint: unix:///run/containerd/containerd.sock
image-endpoint: unix:///run/containerd/containerd.sock
timeout: 10
debug: false
EOF

3) 查看containerd的版本
ctr version
  Client:
  Version:  1.6.33
  Revision: d2d58213f83a351ca8f528a95fbd145f5654e957
  Go version: go1.21.11

  Server:
  Version:  1.6.33
  Revision: d2d58213f83a351ca8f528a95fbd145f5654e957
  UUID: 2edf9793-a435-4cd2-86fa-f15cc9572ad1


### 三.containerd的名称空间，镜像和容器，任务管理快速入门
1.名称空间管理
	1 查看现有的名称空间
    [root@k8s-master01 ~]# ctr ns ls
    NAME LABELS 
    [root@k8s-master01 ~]# 

	2 创建名称空间
    [root@k8s-master01 ~]# ctr ns c yinzhengjie-linux
    [root@k8s-master01 ~]# 
    [root@k8s-master01 ~]# ctr ns ls
    NAME            LABELS 
    yinzhengjie-linux        
    [root@k8s-master01 ~]# 

	3 删除名称空间
    [root@k8s-master01 ~]# ctr ns rm yinzhengjie-linux
    yinzhengjie-linux
    [root@k8s-master01 ~]# 
    [root@k8s-master01 ~]# ctr ns ls
    NAME LABELS 
    [root@k8s-master01 ~]# 

温馨提示:删除的名称空间必须为空，否则无法删除！

2.镜像管理
	1 拉取镜像到指定的名称空间
    [root@k8s-master01 ~]# ctr ns c yinzhengjie-linux
    [root@k8s-master01 ~]# 
    [root@k8s-master01 ~]# ctr ns ls
    NAME            LABELS 
    yinzhengjie-linux        
    [root@k8s-master01 ~]# 
    [root@k8s-master01 ~]# ctr image pull registry.cn-hangzhou.aliyuncs.com/k8s-k8s/apps:v1
    [root@k8s-master01 ~]# 
    [root@k8s-master01 ~]# ctr ns ls
    NAME            LABELS 
    default                
    yinzhengjie-linux        
    [root@k8s-master01 ~]# 
    [root@k8s-master01 ~]# ctr i ls
    REF                                                       TYPE                                                 DIGEST                                                                  SIZE    PLATFORMS   LABELS 
    registry.cn-hangzhou.aliyuncs.com/k8s-k8s/apps:v1 application/vnd.docker.distribution.manifest.v2+json sha256:3bee216f250cfd2dbda1744d6849e27118845b8f4d55dda3ca3c6c1227cc2e5c 9.6 MiB linux/amd64 -      
    [root@k8s-master01 ~]# 
    [root@k8s-master01 ~]# ctr -n default i ls
    REF                                                       TYPE                                                 DIGEST                                                                  SIZE    PLATFORMS   LABELS 
    registry.cn-hangzhou.aliyuncs.com/k8s-k8s/apps:v1 application/vnd.docker.distribution.manifest.v2+json sha256:3bee216f250cfd2dbda1744d6849e27118845b8f4d55dda3ca3c6c1227cc2e5c 9.6 MiB linux/amd64 -      
    [root@k8s-master01 ~]# 
    [root@k8s-master01 ~]# 
    [root@k8s-master01 ~]# ctr  -n yinzhengjie-linux i ls
    REF TYPE DIGEST SIZE PLATFORMS LABELS 
    [root@k8s-master01 ~]# 
    [root@k8s-master01 ~]# ctr  -n yinzhengjie-linux i ls
    REF TYPE DIGEST SIZE PLATFORMS LABELS 
    [root@k8s-master01 ~]# 
    [root@k8s-master01 ~]# ctr -n yinzhengjie-linux image pull registry.cn-hangzhou.aliyuncs.com/k8s-k8s/apps:v2 
    [root@k8s-master01 ~]# 
    [root@k8s-master01 ~]# ctr  -n yinzhengjie-linux i ls
    REF                                                       TYPE                                                 DIGEST                                                                  SIZE    PLATFORMS   LABELS 
    registry.cn-hangzhou.aliyuncs.com/k8s-k8s/apps:v2 application/vnd.docker.distribution.manifest.v2+json sha256:3ac38ee6161e11f2341eda32be95dcc6746f587880f923d2d24a54c3a525227e 9.6 MiB linux/amd64 -      
    [root@k8s-master01 ~]# 


	2 删除镜像
    [root@k8s-master01 ~]# ctr -n default i ls
    REF                                                       TYPE                                                 DIGEST                                                                  SIZE    PLATFORMS   LABELS 
    registry.cn-hangzhou.aliyuncs.com/k8s-k8s/apps:v1 application/vnd.docker.distribution.manifest.v2+json sha256:3bee216f250cfd2dbda1744d6849e27118845b8f4d55dda3ca3c6c1227cc2e5c 9.6 MiB linux/amd64 -      
    [root@k8s-master01 ~]# 
    [root@k8s-master01 ~]# 
    [root@k8s-master01 ~]# ctr i rm registry.cn-hangzhou.aliyuncs.com/k8s-k8s/apps:v1
    registry.cn-hangzhou.aliyuncs.com/k8s-k8s/apps:v1
    [root@k8s-master01 ~]# 
    [root@k8s-master01 ~]# ctr -n default i ls
    REF TYPE DIGEST SIZE PLATFORMS LABELS 
    [root@k8s-master01 ~]# 

3.容器管理
	1 运行一个容器
    [root@k8s-master01 ~]# ctr -n yinzhengjie-linux run registry.cn-hangzhou.aliyuncs.com/k8s-k8s/apps:v2 haha

	2 查看容器列表
    [root@k8s-master01 ~]# ctr -n yinzhengjie-linux c ls
    CONTAINER    IMAGE                                                        RUNTIME                  
    haha         registry.cn-hangzhou.aliyuncs.com/k8s-k8s/apps:v2    io.containerd.runc.v2     
    [root@k8s-master01 ~]# 

	3 查看正在运行的容器ID
    [root@k8s-master01 ~]# ctr -n yinzhengjie-linux t ls
    TASK    PID     STATUS    
    haha    4842    RUNNING
    [root@k8s-master01 ~]# 

	4 连接正在运行的容器
    [root@k8s-master01 ~]# ctr -n yinzhengjie-linux t exec -t --exec-id 2024 haha sh
    / # 
    / # ifconfig 
    lo        Link encap:Local Loopback  
            inet addr:127.0.0.1  Mask:255.0.0.0
            inet6 addr: ::1/128 Scope:Host
            UP LOOPBACK RUNNING  MTU:65536  Metric:1
            RX packets:0 errors:0 dropped:0 overruns:0 frame:0
            TX packets:0 errors:0 dropped:0 overruns:0 carrier:0
            collisions:0 txqueuelen:1000 
            RX bytes:0 (0.0 B)  TX bytes:0 (0.0 B)

    / #


温馨提示:
	containerd本身并不提供网络，只负责容器的生命周期。
	将来网络部分交给专门的CNI插件提供。
	
	5 杀死一个正在运行的容器
    [root@k8s-master01 ~]# ctr -n yinzhengjie-linux t ls
    TASK    PID     STATUS    
    haha    4842    RUNNING
    [root@k8s-master01 ~]# 
    [root@k8s-master01 ~]# ctr -n yinzhengjie-linux t kill haha
    [root@k8s-master01 ~]# 
    [root@k8s-master01 ~]# ctr -n yinzhengjie-linux t ls
    TASK    PID    STATUS    
    [root@k8s-master01 ~]# 


	6 删除容器 
    [root@k8s-master01 ~]# ctr -n yinzhengjie-linux c ls
    CONTAINER    IMAGE                                                        RUNTIME                  
    haha         registry.cn-hangzhou.aliyuncs.com/k8s-k8s/apps:v2    io.containerd.runc.v2    
    [root@k8s-master01 ~]# 
    [root@k8s-master01 ~]# 
    [root@k8s-master01 ~]# ctr -n yinzhengjie-linux c rm haha
    [root@k8s-master01 ~]# 
    [root@k8s-master01 ~]# ctr -n yinzhengjie-linux c ls
    CONTAINER    IMAGE                                                        RUNTIME                  
    [root@k8s-master01 ~]# 

更多containerd学习资料推荐：
	https://www.cnblogs.com/k8s/p/18030527
	https://www.cnblogs.com/k8s/p/18058010


### 四.安装etcd程序

1.下载etcd的软件包
wget https://github.com/etcd-io/etcd/releases/download/v3.5.15/etcd-v3.5.15-linux-amd64.tar.gz

2.解压etcd的二进制程序包到PATH环境变量路径
	1 解压软件包
    [root@k8s-master01 ~]# tar -xf etcd-v3.5.15-linux-amd64.tar.gz --strip-components=1 -C /usr/local/bin etcd-v3.5.15-linux-amd64/etcd{,ctl}
    [root@k8s-master01 ~]# 
    [root@k8s-master01 ~]# ll /usr/local/bin/
    total 39760
    drwxr-xr-x  2 root        root            4096 Jun 24 14:39 ./
    drwxr-xr-x 10 root        root            4096 Aug 10  2023 ../
    -rwxr-xr-x  1 yinzhengjie yinzhengjie 23162880 May 30 02:35 etcd*
    -rwxr-xr-x  1 yinzhengjie yinzhengjie 17543168 May 30 02:35 etcdctl*
    [root@k8s-master01 ~]# 

	2 查看etcd版本
    [root@k8s-master01 ~]# etcdctl version
    etcdctl version: 3.5.15
    API version: 3.5
    [root@k8s-master01 ~]# 


### 五.安装K8S程序

1.下载软件包
[root@k8s-master01 ~]# wget https://dl.k8s.io/v1.30.3/kubernetes-server-linux-amd64.tar.gz

2.解压K8S的二进制程序包到PATH环境变量路径
1) 解压软件包
[root@k8s-master01 ~]# tar -xf kubernetes-server-linux-amd64.tar.gz  --strip-components=3 -C /usr/local/bin kubernetes/server/bin/kube{let,ctl,-apiserver,-controller-manager,-scheduler,-proxy}

2) 查看kubelet的版本
[root@k8s-master01 ~]# kubelet --version
Kubernetes v1.30.2
[root@k8s-master01 ~]# 
    

### 六.生成etcd证书文件
1.安装cfssl证书管理工具
github下载地址:
https://github.com/cloudflare/cfssl

温馨提示:
	生成K8S和etcd证书这一步骤很关键，我建议各位在做实验前先对K8S集群的所有节点拍一下快照，以避免你实验做失败了方便回滚。
	关于cfssl证书可以自行在github下载即可，当然也可以使用我课堂上给大家下载好的软件包哟。

下载软件包:
wget https://github.com/cloudflare/cfssl/releases/download/v1.6.5/cfssl-certinfo_1.6.5_linux_amd64
wget https://github.com/cloudflare/cfssl/releases/download/v1.6.5/cfssljson_1.6.5_linux_amd64
wget https://github.com/cloudflare/cfssl/releases/download/v1.6.5/cfssl_1.6.5_linux_amd64


使用我的软件包具体操作如下：
1) 解压压缩包
[root@k8s-master01 ~]# unzip cfssl-v1.6.5.zip 

2) 重命名cfssl的版本号信息
[root@k8s-master01 ~]# ll cfssl*
-rw-r--r-- 1 root root 11890840 Jun 15 11:56 cfssl_1.6.5_linux_amd64
-rw-r--r-- 1 root root  8413336 Jun 15 11:56 cfssl-certinfo_1.6.5_linux_amd64
-rw-r--r-- 1 root root  6205592 Jun 15 11:56 cfssljson_1.6.5_linux_amd64
[root@k8s-master01 ~]# 
[root@k8s-master01 ~]# rename -v "s/_1.6.5_linux_amd64//g" cfssl*
cfssl_1.6.5_linux_amd64 renamed as cfssl
cfssl-certinfo_1.6.5_linux_amd64 renamed as cfssl-certinfo
cfssljson_1.6.5_linux_amd64 renamed as cfssljson
[root@k8s-master01 ~]# 
[root@k8s-master01 ~]# ll cfssl*
-rw-r--r-- 1 root root 11890840 Jun 15 11:56 cfssl
-rw-r--r-- 1 root root  8413336 Jun 15 11:56 cfssl-certinfo
-rw-r--r-- 1 root root  6205592 Jun 15 11:56 cfssljson
[root@k8s-master01 ~]# 

3) 将cfssl证书拷贝到环境变量并授权执行权限
[root@k8s-master01 ~]# mv cfssl* /usr/local/bin/
[root@k8s-master01 ~]# 
[root@k8s-master01 ~]# chmod +x /usr/local/bin/cfssl*
[root@k8s-master01 ~]# 
[root@k8s-master01 ~]# ll /usr/local/bin/cfssl*
-rwxr-xr-x 1 root root 11890840 Jun 15 11:56 /usr/local/bin/cfssl*
-rwxr-xr-x 1 root root  8413336 Jun 15 11:56 /usr/local/bin/cfssl-certinfo*
-rwxr-xr-x 1 root root  6205592 Jun 15 11:56 /usr/local/bin/cfssljson*
[root@k8s-master01 ~]# 


2.k8s-master01节点创建证书存储目录
mkdir -pv /k8s/certs/{etcd,kubernetes,kubeconfig,pki}/ && cd /k8s/certs/pki/

3.k8s-master01节点生成etcd证书的自建ca证书
	
1) 生成证书的CSR文件： 证书签发请求文件，配置了一些域名，公司，单位
[root@k8s-master01 pki]# cat > etcd-ca-csr.json <<EOF
{
  "CN": "etcd",
  "key": {
    "algo": "rsa",
    "size": 2048
  },
  "names": [
    {
      "C": "CN",
      "ST": "Guangzhou",
      "L": "Guangzhou",
      "O": "etcd",
      "OU": "Etcd Security"
    }
  ],
  "ca": {
    "expiry": "876000h"
  }
}
EOF


2) 生成etcd CA证书和CA证书的key
[root@k8s-master01 pki]# cfssl gencert -initca etcd-ca-csr.json | cfssljson -bare /k8s/certs/etcd/etcd-ca
2024/06/24 15:14:28 [INFO] generating a new CA key and certificate from CSR
2024/06/24 15:14:28 [INFO] generate received request
2024/06/24 15:14:28 [INFO] received CSR
2024/06/24 15:14:28 [INFO] generating key: rsa-2048
2024/06/24 15:14:29 [INFO] encoded CSR
2024/06/24 15:14:29 [INFO] signed certificate with serial number 45472152341303655022232330737492953237610051483
[root@k8s-master01 pki]# 
[root@k8s-master01 pki]# ll /k8s/certs/etcd/
total 20
drwxr-xr-x 2 root root 4096 Jun 24 15:14 ./
drwxr-xr-x 4 root root 4096 Jun 24 15:12 ../
-rw-r--r-- 1 root root 1050 Jun 24 15:14 etcd-ca.csr
-rw------- 1 root root 1679 Jun 24 15:14 etcd-ca-key.pem
-rw-r--r-- 1 root root 1318 Jun 24 15:14 etcd-ca.pem
[root@k8s-master01 pki]# 

4.k8s-master01节点基于自建ca证书颁发etcd证书
1) 生成etcd证书的有效期为100年
[root@k8s-master01 pki]# cat > ca-config.json <<EOF
{
  "signing": {
    "default": {
      "expiry": "876000h"
    },
    "profiles": {
      "kubernetes": {
        "usages": [
            "signing",
            "key encipherment",
            "server auth",
            "client auth"
        ],
        "expiry": "876000h"
      }
    }
  }
}
EOF


2) 生成证书的CSR文件： 证书签发请求文件，配置了一些域名，公司，单位
[root@k8s-master01 pki]# cat > etcd-csr.json <<EOF
{
  "CN": "etcd",
  "key": {
    "algo": "rsa",
    "size": 2048
  },
  "names": [
    {
      "C": "CN",
      "ST": "Guangzhou",
      "L": "Guangzhou",
      "O": "etcd",
      "OU": "Etcd Security"
    }
  ]
}
EOF

3) 基于自建的ectd ca证书生成etcd的证书
[root@k8s-master01 pki]# cfssl gencert \
  -ca=/k8s/certs/etcd/etcd-ca.pem \
  -ca-key=/k8s/certs/etcd/etcd-ca-key.pem \
  -config=ca-config.json \
  --hostname=192.168.31.10,k8s-master01 \
  --profile=kubernetes \
  etcd-csr.json  | cfssljson -bare /k8s/certs/etcd/etcd-server

[root@k8s-master01 pki]# ll /k8s/certs/etcd/etcd-server*
-rw-r--r-- 1 root root 1131 Jun 24 15:18 /k8s/certs/etcd/etcd-server.csr
-rw------- 1 root root 1679 Jun 24 15:18 /k8s/certs/etcd/etcd-server-key.pem
-rw-r--r-- 1 root root 1464 Jun 24 15:18 /k8s/certs/etcd/etcd-server.pem
[root@k8s-master01 pki]# 


### 七.启动etcd集群
1.创建etcd集群各节点配置文件

1) k8s-master01节点的配置文件
[root@k8s-master01 ~]# mkdir -pv /etc/etcd /var/lib/etcd/wal
[root@k8s-master01 ~]# cat > /etc/etcd/etcd.config.yml <<'EOF'
name: 'k8s-master01'
data-dir: /var/lib/etcd
wal-dir: /var/lib/etcd/wal
snapshot-count: 5000
heartbeat-interval: 100
election-timeout: 1000
quota-backend-bytes: 0
listen-peer-urls: 'https://192.168.31.10:2380'
listen-client-urls: 'https://192.168.31.10:2379,http://127.0.0.1:2379'
max-snapshots: 3
max-wals: 5
cors:
initial-advertise-peer-urls: 'https://192.168.31.10:2380'
advertise-client-urls: 'https://192.168.31.10:2379'
discovery:
discovery-fallback: 'proxy'
discovery-proxy:
discovery-srv:
initial-cluster: 'k8s-master01=https://192.168.31.10:2380'
initial-cluster-token: 'etcd-k8s-cluster'
initial-cluster-state: 'new'
strict-reconfig-check: false
enable-v2: true
enable-pprof: true
proxy: 'off'
proxy-failure-wait: 5000
proxy-refresh-interval: 30000
proxy-dial-timeout: 1000
proxy-write-timeout: 5000
proxy-read-timeout: 0
client-transport-security:
 cert-file: '/k8s/certs/etcd/etcd-server.pem'
 key-file: '/k8s/certs/etcd/etcd-server-key.pem'
 client-cert-auth: true
 trusted-ca-file: '/k8s/certs/etcd/etcd-ca.pem'
 auto-tls: true
peer-transport-security:
 cert-file: '/k8s/certs/etcd/etcd-server.pem'
 key-file: '/k8s/certs/etcd/etcd-server-key.pem'
 peer-client-cert-auth: true
 trusted-ca-file: '/k8s/certs/etcd/etcd-ca.pem'
 auto-tls: true
debug: false
log-package-levels:
log-outputs: [default]
force-new-cluster: false
EOF

2.k8s-master01编写etcd启动脚本
cat > /etc/systemd/system/etcd.service <<'EOF'
[Unit]
Description=Pillar's Etcd Service
Documentation=https://coreos.com/etcd/docs/latest/
After=network.target

[Service]
Type=notify
ExecStart=/usr/local/bin/etcd --config-file=/etc/etcd/etcd.config.yml
Restart=on-failure
RestartSec=10
LimitNOFILE=65536

[Install]
WantedBy=multi-user.target
Alias=etcd3.service
EOF

3.启动etcd集群
1）启动服务
systemctl daemon-reload && systemctl enable --now etcd
systemctl status etcd

2）查看etcd集群状态
etcdctl --endpoints="192.168.31.10:2379" --cacert=/k8s/certs/etcd/etcd-ca.pem --cert=/k8s/certs/etcd/etcd-server.pem --key=/k8s/certs/etcd/etcd-server-key.pem  endpoint status --write-out=table


### 八.生成k8s组件相关证书
1.所有节点创建k8s证书存储目录
mkdir -pv /k8s/certs/kubernetes/

2.k8s-master01节点生成kubernetes自建ca证书
1) 生成证书的CSR文件： 证书签发请求文件，配置了一些域名，公司，单位
[root@k8s-master01 pki]# cat > k8s-ca-csr.json  <<EOF
{
  "CN": "kubernetes",
  "key": {
    "algo": "rsa",
    "size": 2048
  },
  "names": [
    {
      "C": "CN",
      "ST": "Guangzhou",
      "L": "Guangzhou",
      "O": "Kubernetes",
      "OU": "Kubernetes-manual"
    }
  ],
  "ca": {
    "expiry": "876000h"
  }
}
EOF


2) 生成kubernetes证书
[root@k8s-master01 pki]# cfssl gencert -initca k8s-ca-csr.json | cfssljson -bare /k8s/certs/kubernetes/k8s-ca
[root@k8s-master01 pki]# 
[root@k8s-master01 pki]# ll /k8s/certs/kubernetes/
total 20
drwxr-xr-x 2 root root 4096 Jun 24 15:51 ./
drwxr-xr-x 5 root root 4096 Jun 24 15:49 ../
-rw-r--r-- 1 root root 1070 Jun 24 15:51 k8s-ca.csr
-rw------- 1 root root 1679 Jun 24 15:51 k8s-ca-key.pem
-rw-r--r-- 1 root root 1363 Jun 24 15:51 k8s-ca.pem
[root@k8s-master01 pki]# 
 
3.k8s-master01节点基于自建ca证书颁发apiserver相关证书
1) 生成k8s证书的有效期为100年
[root@k8s-master01 pki]# cat > k8s-ca-config.json <<EOF
{
  "signing": {
    "default": {
      "expiry": "876000h"
    },
    "profiles": {
      "kubernetes": {
        "usages": [
            "signing",
            "key encipherment",
            "server auth",
            "client auth"
        ],
        "expiry": "876000h"
      }
    }
  }
}
EOF


2) 生成apiserver证书的CSR文件： 证书签发请求文件，配置了一些域名，公司，单位
[root@k8s-master01 pki]# cat > apiserver-csr.json <<EOF
{
  "CN": "kube-apiserver",
  "key": {
    "algo": "rsa",
    "size": 2048
  },
  "names": [
    {
      "C": "CN",
      "ST": "Guangzhou",
      "L": "Guangzhou",
      "O": "Kubernetes",
      "OU": "Kubernetes-manual"
    }
  ]
}
EOF


3) 基于自建ca证书生成apiServer的证书文件
[root@k8s-master01 pki]# cfssl gencert \
  -ca=/k8s/certs/kubernetes/k8s-ca.pem \
  -ca-key=/k8s/certs/kubernetes/k8s-ca-key.pem \
  -config=k8s-ca-config.json \
  --hostname=192.168.31.10,192.168.31.11,192.168.31.12,kubernetes,kubernetes.default,kubernetes.default.svc,k8s-master01,k8s-node01,k8s-node02,10.200.0.1,10.200.0.2,10.200.0.3 \
  --profile=kubernetes \
   apiserver-csr.json  | cfssljson -bare /k8s/certs/kubernetes/apiserver


[root@k8s-master01 pki]# ll /k8s/certs/kubernetes/apiserver*
-rw-r--r-- 1 root root 1310 Jun 24 15:55 /k8s/certs/kubernetes/apiserver.csr
-rw------- 1 root root 1675 Jun 24 15:55 /k8s/certs/kubernetes/apiserver-key.pem
-rw-r--r-- 1 root root 1704 Jun 24 15:55 /k8s/certs/kubernetes/apiserver.pem
[root@k8s-master01 pki]# 


4.生成第三方组件与apiServer通信的聚合证书
聚合证书的作用就是让第三方组件(比如metrics-server等)能够拿这个证书文件和apiServer进行通信。
	
1) 生成聚合证书的用于自建ca的CSR文件
[root@k8s-master01 pki]# cat > front-proxy-ca-csr.json <<EOF
{
  "CN": "kubernetes",
  "key": {
     "algo": "rsa",
     "size": 2048
  }
}
EOF

2) 生成聚合证书的自建ca证书
[root@k8s-master01 pki]# cfssl gencert -initca front-proxy-ca-csr.json | cfssljson -bare /k8s/certs/kubernetes/front-proxy-ca
[root@k8s-master01 pki]# 
[root@k8s-master01 pki]# ll /k8s/certs/kubernetes/front-proxy-ca*
-rw-r--r-- 1 root root  891 Jun 24 15:59 /k8s/certs/kubernetes/front-proxy-ca.csr
-rw------- 1 root root 1675 Jun 24 15:59 /k8s/certs/kubernetes/front-proxy-ca-key.pem
-rw-r--r-- 1 root root 1094 Jun 24 15:59 /k8s/certs/kubernetes/front-proxy-ca.pem
[root@k8s-master01 pki]# 

3) 生成聚合证书的用于客户端的CSR文件
[root@k8s-master01 pki]# cat > front-proxy-client-csr.json <<EOF
{
  "CN": "front-proxy-client",
  "key": {
     "algo": "rsa",
     "size": 2048
  }
}
EOF


4) 基于聚合证书的自建ca证书签发聚合证书的客户端证书
[root@k8s-master01 pki]# cfssl gencert \
  -ca=/k8s/certs/kubernetes/front-proxy-ca.pem \
  -ca-key=/k8s/certs/kubernetes/front-proxy-ca-key.pem \
  -config=k8s-ca-config.json \
  -profile=kubernetes \
  front-proxy-client-csr.json | cfssljson -bare /k8s/certs/kubernetes/front-proxy-client
[root@k8s-master01 pki]# 
[root@k8s-master01 pki]# ll /k8s/certs/kubernetes/front-proxy-client*
-rw-r--r-- 1 root root  903 Jun 24 16:00 /k8s/certs/kubernetes/front-proxy-client.csr
-rw------- 1 root root 1679 Jun 24 16:00 /k8s/certs/kubernetes/front-proxy-client-key.pem
-rw-r--r-- 1 root root 1188 Jun 24 16:00 /k8s/certs/kubernetes/front-proxy-client.pem
[root@k8s-master01 pki]# 


5.生成controller-manager证书及kubeconfig文件
1) 生成controller-manager的CSR文件
[root@k8s-master01 pki]# cat > controller-manager-csr.json <<EOF
{
  "CN": "system:kube-controller-manager",
  "key": {
    "algo": "rsa",
    "size": 2048
  },
  "names": [
    {
      "C": "CN",
      "ST": "Guangzhou",
      "L": "Guangzhou",
      "O": "system:kube-controller-manager",
      "OU": "Kubernetes-manual"
    }
  ]
}
EOF


2) 生成controller-manager证书文件
[root@k8s-master01 pki]# cfssl gencert \
  -ca=/k8s/certs/kubernetes/k8s-ca.pem \
  -ca-key=/k8s/certs/kubernetes/k8s-ca-key.pem \
  -config=k8s-ca-config.json \
  -profile=kubernetes \
  controller-manager-csr.json | cfssljson -bare /k8s/certs/kubernetes/controller-manager

[root@k8s-master01 pki]# ll /k8s/certs/kubernetes/controller-manager*
-rw-r--r-- 1 root root 1082 Jun 24 16:02 /k8s/certs/kubernetes/controller-manager.csr
-rw------- 1 root root 1675 Jun 24 16:02 /k8s/certs/kubernetes/controller-manager-key.pem
-rw-r--r-- 1 root root 1501 Jun 24 16:02 /k8s/certs/kubernetes/controller-manager.pem
[root@k8s-master01 pki]# 

3) 创建一个kubeconfig目录
[root@k8s-master01 pki]# mkdir -pv /k8s/certs/kubeconfig

4) 设置一个集群
[root@k8s-master01 pki]# kubectl config set-cluster k8s-cluster01 \
  --certificate-authority=/k8s/certs/kubernetes/k8s-ca.pem \
  --embed-certs=true \
  --server=https://192.168.31.10:6443 \
  --kubeconfig=/k8s/certs/kubeconfig/kube-controller-manager.kubeconfig
		
5) 设置一个用户项
[root@k8s-master01 pki]# kubectl config set-credentials system:kube-controller-manager \
  --client-certificate=/k8s/certs/kubernetes/controller-manager.pem \
  --client-key=/k8s/certs/kubernetes/controller-manager-key.pem \
  --embed-certs=true \
  --kubeconfig=/k8s/certs/kubeconfig/kube-controller-manager.kubeconfig
  
6) 设置一个上下文环境
[root@k8s-master01 pki]# kubectl config set-context system:kube-controller-manager@kubernetes \
  --cluster=k8s-cluster01 \
  --user=system:kube-controller-manager \
  --kubeconfig=/k8s/certs/kubeconfig/kube-controller-manager.kubeconfig
  
7) 使用默认的上下文
[root@k8s-master01 pki]# kubectl config use-context system:kube-controller-manager@kubernetes \
  --kubeconfig=/k8s/certs/kubeconfig/kube-controller-manager.kubeconfig

6.生成scheduler证书及kubeconfig文件
1) 生成scheduler的CSR文件
[root@k8s-master01 pki]# cat > scheduler-csr.json <<EOF
{
  "CN": "system:kube-scheduler",
  "key": {
    "algo": "rsa",
    "size": 2048
  },
  "names": [
    {
      "C": "CN",
      "ST": "Guangzhou",
      "L": "Guangzhou",
      "O": "system:kube-scheduler",
      "OU": "Kubernetes-manual"
    }
  ]
}
EOF


2) 生成scheduler证书文件
[root@k8s-master01 pki]# cfssl gencert \
  -ca=/k8s/certs/kubernetes/k8s-ca.pem \
  -ca-key=/k8s/certs/kubernetes/k8s-ca-key.pem \
  -config=k8s-ca-config.json \
  -profile=kubernetes \
  scheduler-csr.json | cfssljson -bare /k8s/certs/kubernetes/scheduler


[root@k8s-master01 pki]# ll /k8s/certs/kubernetes/scheduler*
-rw-r--r-- 1 root root 1058 Jun 24 16:06 /k8s/certs/kubernetes/scheduler.csr
-rw------- 1 root root 1679 Jun 24 16:06 /k8s/certs/kubernetes/scheduler-key.pem
-rw-r--r-- 1 root root 1476 Jun 24 16:06 /k8s/certs/kubernetes/scheduler.pem
[root@k8s-master01 pki]# 


3) 设置一个集群
[root@k8s-master01 pki]# kubectl config set-cluster k8s-cluster01 \
  --certificate-authority=/k8s/certs/kubernetes/k8s-ca.pem \
  --embed-certs=true \
  --server=https://192.168.31.10:6443 \
  --kubeconfig=/k8s/certs/kubeconfig/kube-scheduler.kubeconfig
  
  
4) 设置一个用户项
[root@k8s-master01 pki]# kubectl config set-credentials system:kube-scheduler \
  --client-certificate=/k8s/certs/kubernetes/scheduler.pem \
  --client-key=/k8s/certs/kubernetes/scheduler-key.pem \
  --embed-certs=true \
  --kubeconfig=/k8s/certs/kubeconfig/kube-scheduler.kubeconfig


5) 设置一个上下文环境
[root@k8s-master01 pki]# kubectl config set-context system:kube-scheduler@kubernetes \
  --cluster=k8s-cluster01 \
  --user=system:kube-scheduler \
  --kubeconfig=/k8s/certs/kubeconfig/kube-scheduler.kubeconfig
  
6) 使用默认的上下文
[root@k8s-master01 pki]# kubectl config use-context system:kube-scheduler@kubernetes \
  --kubeconfig=/k8s/certs/kubeconfig/kube-scheduler.kubeconfig


7.配置k8s集群管理员证书及kubeconfig文件
1) 生成管理员的CSR文件
[root@k8s-master01 pki]# cat > admin-csr.json <<EOF
{
  "CN": "admin",
  "key": {
    "algo": "rsa",
    "size": 2048
  },
  "names": [
    {
      "C": "CN",
      "ST": "Guangzhou",
      "L": "Guangzhou",
      "O": "system:masters",
      "OU": "Kubernetes-manual"
    }
  ]
}
EOF

2) 生成k8s集群管理员证书
[root@k8s-master01 pki]# cfssl gencert \
  -ca=/k8s/certs/kubernetes/k8s-ca.pem \
  -ca-key=/k8s/certs/kubernetes/k8s-ca-key.pem \
  -config=k8s-ca-config.json \
  -profile=kubernetes \
  admin-csr.json | cfssljson -bare /k8s/certs/kubernetes/admin


[root@k8s-master01 pki]# ll /k8s/certs/kubernetes/admin*
-rw-r--r-- 1 root root 1025 Jun 24 16:09 /k8s/certs/kubernetes/admin.csr
-rw------- 1 root root 1679 Jun 24 16:09 /k8s/certs/kubernetes/admin-key.pem
-rw-r--r-- 1 root root 1444 Jun 24 16:09 /k8s/certs/kubernetes/admin.pem
[root@k8s-master01 pki]# 


3) 设置一个集群
[root@k8s-master01 pki]# kubectl config set-cluster k8s-cluster01 \
  --certificate-authority=/k8s/certs/kubernetes/k8s-ca.pem \
  --embed-certs=true \
  --server=https://192.168.31.10:6443 \
  --kubeconfig=/k8s/certs/kubeconfig/kube-admin.kubeconfig
  
4) 设置一个用户项
[root@k8s-master01 pki]# kubectl config set-credentials kube-admin \
  --client-certificate=/k8s/certs/kubernetes/admin.pem \
  --client-key=/k8s/certs/kubernetes/admin-key.pem \
  --embed-certs=true \
  --kubeconfig=/k8s/certs/kubeconfig/kube-admin.kubeconfig

5) 设置一个上下文环境
[root@k8s-master01 pki]# kubectl config set-context kube-admin@kubernetes \
  --cluster=k8s-cluster01 \
  --user=kube-admin \
  --kubeconfig=/k8s/certs/kubeconfig/kube-admin.kubeconfig
  
6) 使用默认的上下文
[root@k8s-master01 pki]# kubectl config use-context kube-admin@kubernetes \
  --kubeconfig=/k8s/certs/kubeconfig/kube-admin.kubeconfig


8.创建ServiceAccount
1) ServiceAccount是k8s一种认证方式，创建ServiceAccount的时候会创建一个与之绑定的secret，这个secret会生成一个token
[root@k8s-master01 pki]# openssl genrsa -out /k8s/certs/kubernetes/sa.key 2048


2) 基于sa.key创建sa.pub
[root@k8s-master01 pki]# openssl rsa -in /k8s/certs/kubernetes/sa.key -pubout -out /k8s/certs/kubernetes/sa.pub
[root@k8s-master01 pki]# 
[root@k8s-master01 pki]# ll /k8s/certs/kubernetes/sa*
-rw------- 1 root root 1704 Jun 24 16:11 /k8s/certs/kubernetes/sa.key
-rw-r--r-- 1 root root  451 Jun 24 16:11 /k8s/certs/kubernetes/sa.pub
[root@k8s-master01 pki]# 


### 九.高可用组件haproxy+keepalived安装及验证(多个master节点)
1 所有master【k8s-master[01-03]】节点安装高可用组件
温馨提示:
    - 对于高可用组件，其实我们也可以单独找两台虚拟机来部署，但我为了节省2台机器，就直接在master节点复用了。
    - 如果在云上安装K8S则无安装高可用组件了，毕竟公有云大部分都是不支持keepalived的，可以直接使用云产品，比如阿里的"SLB"，腾讯的"ELB"等SAAS产品;
    - 推荐使用ELB，SLB有回环的问题，也就是SLB代理的服务器不能反向访问SLB，但是腾讯云修复了这个问题;

具体实操:
	apt-get -y install keepalived haproxy 
2.所有master节点配置haproxy
温馨提示:
	- haproxy的负载均衡器监听地址我配置是6443，你可以修改为其他端口，haproxy会用来反向代理各个master组件的地址;
	- 如果你真的修改晴一定注意上面的证书配置的kubeconfig文件，也要一起修改，否则就会出现链接集群失败的问题;
	
具体实操:
	1 备份配置文件
cp /etc/haproxy/haproxy.cfg{,`date +%F`}

	2 所有节点的配置文件内容相同
cat > /etc/haproxy/haproxy.cfg <<'EOF'
global
  maxconn  2000
  ulimit-n  16384
  log  127.0.0.1 local0 err
  stats timeout 30s

defaults
  log global
  mode  http
  option  httplog
  timeout connect 5000
  timeout client  50000
  timeout server  50000
  timeout http-request 15s
  timeout http-keep-alive 15s

frontend monitor-haproxy
  bind *:9999
  mode http
  option httplog
  monitor-uri /ruok

frontend k8s-cluster01
  bind 0.0.0.0:6443
  bind 127.0.0.1:6443
  mode tcp
  option tcplog
  tcp-request inspect-delay 5s
  default_backend k8s-cluster01

backend k8s-cluster01
  mode tcp
  option tcplog
  option tcp-check
  balance roundrobin
  default-server inter 10s downinter 5s rise 2 fall 2 slowstart 60s maxconn 250 maxqueue 256 weight 100
  server k8s-master01   192.168.31.10:6443  check
  server k8s-master02   10.0.0.242:6443  check
  server k8s-master03   10.0.0.243:6443  check
EOF
	
​

3.所有master节点配置keepalived
温馨提示:
	- 注意"interface"字段为你的物理网卡的名称，如果你的网卡是ens33，请将"eth0"修改为"ens33"哟;
	- 注意"mcast_src_ip"各master节点的配置均不相同，修改根据实际环境进行修改哟;
	- 注意"virtual_ipaddress"指定的是负载均衡器的VIP地址，这个地址也要和kubeconfig文件的Apiserver地址要一致哟;
	- 注意"script"字段的脚本用于检测后端的apiServer是否健康;
	- 注意"router_id"字段为节点ip，master每个节点配置自己的IP
	
具体实操:
	1."k8s-master01"节点创建配置文件
[root@k8s-master01 ~]# ifconfig 
eth0: flags=4163<UP,BROADCAST,RUNNING,MULTICAST>  mtu 1500
        inet 192.168.31.10  netmask 255.255.255.0  broadcast 10.0.0.255
        ether 00:0c:29:32:73:ac  txqueuelen 1000  (Ethernet)
        RX packets 324292  bytes 234183010 (223.3 MiB)
        RX errors 0  dropped 0  overruns 0  frame 0
        TX packets 242256  bytes 31242156 (29.7 MiB)
        TX errors 0  dropped 0 overruns 0  carrier 0  collisions 0

...

[root@k8s-master01 ~]# 
[root@k8s-master01 ~]#  cat > /etc/keepalived/keepalived.conf <<'EOF'
! Configuration File for keepalived
global_defs {
   router_id 192.168.31.10
}
vrrp_script chk_nginx {
    script "/etc/keepalived/check_port.sh 6443"
    interval 2
    weight -20
}
vrrp_instance VI_1 {
    state MASTER
    interface eth0
    virtual_router_id 251
    priority 100
    advert_int 1
    mcast_src_ip 192.168.31.10
    nopreempt
    authentication {
        auth_type PASS
        auth_pass yinzhengjie_k8s
    }
    track_script {
         chk_nginx
    }
    virtual_ipaddress {
        192.168.31.10
    }
}
EOF


	2."k8s-master02"节点创建配置文件
[root@k8s-master02 ~]# ifconfig 
eth0: flags=4163<UP,BROADCAST,RUNNING,MULTICAST>  mtu 1500
        inet 10.0.0.242  netmask 255.255.255.0  broadcast 10.0.0.255
        ether 00:0c:29:cf:ad:0a  txqueuelen 1000  (Ethernet)
        RX packets 256743  bytes 42628265 (40.6 MiB)
        RX errors 0  dropped 0  overruns 0  frame 0
        TX packets 252589  bytes 34277384 (32.6 MiB)
        TX errors 0  dropped 0 overruns 0  carrier 0  collisions 0

...

[root@k8s-master02 ~]# 
[root@k8s-master02 ~]# cat > /etc/keepalived/keepalived.conf <<EOF
! Configuration File for keepalived
global_defs {
   router_id 10.0.0.242
}
vrrp_script chk_nginx {
    script "/etc/keepalived/check_port.sh 6443"
    interval 2
    weight -20
}
vrrp_instance VI_1 {
    state MASTER
    interface eth0
    virtual_router_id 251
    priority 100
    advert_int 1
    mcast_src_ip 10.0.0.242
    nopreempt
    authentication {
        auth_type PASS
        auth_pass yinzhengjie_k8s
    }
    track_script {
         chk_nginx
    }
    virtual_ipaddress {
        192.168.31.10
    }
}
EOF


	3."k8s-master03"节点创建配置文件
[root@k8s-master03 ~]# ifconfig 
eth0: flags=4163<UP,BROADCAST,RUNNING,MULTICAST>  mtu 1500
        inet 10.0.0.243  netmask 255.255.255.0  broadcast 10.0.0.255
        ether 00:0c:29:5f:f7:4f  txqueuelen 1000  (Ethernet)
        RX packets 178577  bytes 34808750 (33.1 MiB)
        RX errors 0  dropped 0  overruns 0  frame 0
        TX packets 171025  bytes 26471309 (25.2 MiB)
        TX errors 0  dropped 0 overruns 0  carrier 0  collisions 0

...

[root@k8s-master03 ~]# 
[root@k8s-master03 ~]# cat > /etc/keepalived/keepalived.conf <<EOF
! Configuration File for keepalived
global_defs {
   router_id 10.0.0.243
}
vrrp_script chk_nginx {
    script "/etc/keepalived/check_port.sh 6443"
    interval 2
    weight -20
}
vrrp_instance VI_1 {
    state MASTER
    interface eth0
    virtual_router_id 251
    priority 100
    advert_int 1
    mcast_src_ip 10.0.0.243
    nopreempt
    authentication {
        auth_type PASS
        auth_pass yinzhengjie_k8s
    }
    track_script {
         chk_nginx
    }
    virtual_ipaddress {
        192.168.31.10
    }
}
EOF


	4.所有keepalived节点均需要创建健康检查脚本
cat > /etc/keepalived/check_port.sh <<'EOF'
#!/bin/bash
CHK_PORT=$1
if [ -n "$CHK_PORT" ];then
    PORT_PROCESS=`ss -lt|grep $CHK_PORT|wc -l`
    if [ $PORT_PROCESS -eq 0 ];then
        echo "Port $CHK_PORT Is Not Used,End."
        systemctl stop keepalived
    fi
else
    echo "Check Port Cant Be Empty!"
fi
EOF
chmod +x /etc/keepalived/check_port.sh 
4.启动keepalived服务并验证
	1.启动keepalived服务
systemctl daemon-reload
systemctl enable --now keepalived
systemctl status keepalived

	2 验证服务是否正常
[root@k8s-master03 ~]# ip a
1: lo: <LOOPBACK,UP,LOWER_UP> mtu 65536 qdisc noqueue state UNKNOWN group default qlen 1000
    link/loopback 00:00:00:00:00:00 brd 00:00:00:00:00:00
    inet 127.0.0.1/8 scope host lo
       valid_lft forever preferred_lft forever
2: eth0: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc pfifo_fast state UP group default qlen 1000
    link/ether 00:0c:29:5f:f7:4f brd ff:ff:ff:ff:ff:ff
    inet 10.0.0.243/24 brd 10.0.0.255 scope global eth0
       valid_lft forever preferred_lft forever
    inet 192.168.31.10/32 scope global eth0
       valid_lft forever preferred_lft forever
3: tunl0@NONE: <NOARP> mtu 1480 qdisc noop state DOWN group default qlen 1000
    link/ipip 0.0.0.0 brd 0.0.0.0
[root@k8s-master03 ~]# 
[root@k8s-master03 ~]# ping 192.168.31.10
PING 192.168.31.10 (192.168.31.10) 56(84) bytes of data.
64 bytes from 192.168.31.10: icmp_seq=1 ttl=64 time=0.019 ms
64 bytes from 192.168.31.10: icmp_seq=2 ttl=64 time=0.027 ms
64 bytes from 192.168.31.10: icmp_seq=3 ttl=64 time=0.023 ms
...


	3 单独开一个终端尝试停止keepalived服务
[root@k8s-master03 ~]# systemctl stop keepalived

	4 再次观察终端输出
[root@k8s-master03 ~]# ping 192.168.31.10
PING 192.168.31.10 (192.168.31.10) 56(84) bytes of data.
64 bytes from 192.168.31.10: icmp_seq=1 ttl=64 time=0.019 ms
64 bytes from 192.168.31.10: icmp_seq=2 ttl=64 time=0.027 ms
64 bytes from 192.168.31.10: icmp_seq=3 ttl=64 time=0.023 ms
...
64 bytes from 192.168.31.10: icmp_seq=36 ttl=64 time=0.037 ms
64 bytes from 192.168.31.10: icmp_seq=37 ttl=64 time=0.023 ms
From 10.0.0.242: icmp_seq=38 Redirect Host(New nexthop: 192.168.31.10)
From 10.0.0.242: icmp_seq=39 Redirect Host(New nexthop: 192.168.31.10)
64 bytes from 192.168.31.10: icmp_seq=40 ttl=64 time=1.81 ms
64 bytes from 192.168.31.10: icmp_seq=41 ttl=64 time=0.680 ms
64 bytes from 192.168.31.10: icmp_seq=42 ttl=64 time=0.751 ms

	5 验证vip是否飘逸到其他节点，果不其然，真的飘逸到其他master节点啦！
[root@k8s-master02 ~]# ip a
...
2: eth0: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc pfifo_fast state UP group default qlen 1000
    link/ether 00:0c:29:cf:ad:0a brd ff:ff:ff:ff:ff:ff
    inet 10.0.0.242/24 brd 10.0.0.255 scope global eth0
       valid_lft forever preferred_lft forever
    inet 192.168.31.10/32 scope global eth0
       valid_lft forever preferred_lft forever
...
[root@k8s-master02 ~]# 
5.验证haproxy服务并验证
	1 所有节点启动haproxy服务
systemctl enable --now haproxy 
systemctl restart haproxy 
systemctl status haproxy 

	2 所有节点启动keepalived 
systemctl start keepalived

	3 基于telnet验证haporxy是否正常
[root@k8s-master02 ~]# telnet 192.168.31.10 6443
Trying 192.168.31.10...
Connected to 192.168.31.10.
Escape character is '^]'.
Connection closed by foreign host.
[root@k8s-master02 ~]# 

	4 基于webUI进行验证
[root@k8s-worker05 ~]# curl http://192.168.31.10:9999/ruok
<html><body><h1>200 OK</h1>
Service ready.
</body></html>
[root@k8s-worker05 ~]# 


### 十.部署ApiServer组件
1 k8s-master01节点启动ApiServer
温馨提示:
  - "--advertise-address"是对应的master节点的IP地址;
  - "--service-cluster-ip-range"对应的是svc的网段
  - "--service-node-port-range"对应的是svc的NodePort端口范围;
  - "--etcd-servers"指定的是etcd集群地址

配置文件参考链接:
	https://kubernetes.io/zh-cn/docs/reference/command-line-tools-reference/kube-apiserver/
	

1) 创建k8s-master01节点的配置文件
cat > /etc/systemd/system/kube-apiserver.service << 'EOF'
[Unit]
Description=Pillar's Kubernetes API Server
Documentation=https://github.com/kubernetes/kubernetes
After=network.target

[Service]
ExecStart=/usr/local/bin/kube-apiserver \
      --v=2  \
      --bind-address=0.0.0.0  \
      --secure-port=6443  \
      --allow_privileged=true \
      --advertise-address=192.168.31.10 \
      --service-cluster-ip-range=10.200.0.0/16  \
      --service-node-port-range=3000-50000  \
      --etcd-servers=https://192.168.31.10:2379 \
      --etcd-cafile=/k8s/certs/etcd/etcd-ca.pem  \
      --etcd-certfile=/k8s/certs/etcd/etcd-server.pem  \
      --etcd-keyfile=/k8s/certs/etcd/etcd-server-key.pem  \
      --client-ca-file=/k8s/certs/kubernetes/k8s-ca.pem  \
      --tls-cert-file=/k8s/certs/kubernetes/apiserver.pem  \
      --tls-private-key-file=/k8s/certs/kubernetes/apiserver-key.pem  \
      --kubelet-client-certificate=/k8s/certs/kubernetes/apiserver.pem  \
      --kubelet-client-key=/k8s/certs/kubernetes/apiserver-key.pem  \
      --service-account-key-file=/k8s/certs/kubernetes/sa.pub  \
      --service-account-signing-key-file=/k8s/certs/kubernetes/sa.key \
      --service-account-issuer=https://kubernetes.default.svc.com \
      --kubelet-preferred-address-types=InternalIP,ExternalIP,Hostname  \
      --enable-admission-plugins=NamespaceLifecycle,LimitRanger,ServiceAccount,DefaultStorageClass,DefaultTolerationSeconds,NodeRestriction,ResourceQuota  \
      --authorization-mode=Node,RBAC  \
      --enable-bootstrap-token-auth=true  \
      --requestheader-client-ca-file=/k8s/certs/kubernetes/front-proxy-ca.pem  \
      --proxy-client-cert-file=/k8s/certs/kubernetes/front-proxy-client.pem  \
      --proxy-client-key-file=/k8s/certs/kubernetes/front-proxy-client-key.pem  \
      --requestheader-allowed-names=aggregator  \
      --requestheader-group-headers=X-Remote-Group  \
      --requestheader-extra-headers-prefix=X-Remote-Extra-  \
      --requestheader-username-headers=X-Remote-User

Restart=on-failure
RestartSec=10s
LimitNOFILE=65535

[Install]
WantedBy=multi-user.target
EOF


2) 启动服务
systemctl daemon-reload && systemctl enable --now kube-apiserver
systemctl status kube-apiserver
ss -ntl | grep 6443


### 十一.部署ControlerManager组件
1.所有节点创建配置文件
温馨提示:

- "--cluster-cidr"是Pod的网段地址，我们可以自行修改。

配置文件参考链接:
	https://kubernetes.io/zh-cn/docs/reference/command-line-tools-reference/kube-controller-manager/
	 
所有节点的controller-manager组件配置文件相同: (前提是证书文件存放的位置也要相同哟!)
cat > /etc/systemd/system/kube-controller-manager.service << 'EOF'
[Unit]
Description=Pillar's Kubernetes Controller Manager
Documentation=https://github.com/kubernetes/kubernetes
After=network.target

[Service]
ExecStart=/usr/local/bin/kube-controller-manager \
      --v=2 \
      --root-ca-file=/k8s/certs/kubernetes/k8s-ca.pem \
      --cluster-signing-cert-file=/k8s/certs/kubernetes/k8s-ca.pem \
      --cluster-signing-key-file=/k8s/certs/kubernetes/k8s-ca-key.pem \
      --service-account-private-key-file=/k8s/certs/kubernetes/sa.key \
      --kubeconfig=/k8s/certs/kubeconfig/kube-controller-manager.kubeconfig \
      --leader-elect=true \
      --use-service-account-credentials=true \
      --node-monitor-grace-period=40s \
      --node-monitor-period=5s \
      --controllers=*,bootstrapsigner,tokencleaner \
      --allocate-node-cidrs=true \
      --cluster-cidr=172.16.0.0/16 \
      --requestheader-client-ca-file=/k8s/certs/kubernetes/front-proxy-ca.pem \
      --node-cidr-mask-size=24
      
Restart=always
RestartSec=10s

[Install]
WantedBy=multi-user.target
EOF

2.启动controller-manager服务
systemctl daemon-reload
systemctl enable --now kube-controller-manager
systemctl status kube-controller-manager
ss -ntl | grep 10257


### 十二.部署Scheduler组件
1.所有节点创建配置文件
配置文件参考链接:
https://kubernetes.io/zh-cn/docs/reference/command-line-tools-reference/kube-scheduler/

所有节点的controller-manager组件配置文件相同: (前提是证书文件存放的位置也要相同哟!)
cat > /etc/systemd/system/kube-scheduler.service <<'EOF'
[Unit]
Description=Pillar's Kubernetes Scheduler
Documentation=https://github.com/kubernetes/kubernetes
After=network.target

[Service]
ExecStart=/usr/local/bin/kube-scheduler \
      --v=2 \
      --leader-elect=true \
      --kubeconfig=/k8s/certs/kubeconfig/kube-scheduler.kubeconfig

Restart=always
RestartSec=10s

[Install]
WantedBy=multi-user.target
EOF

2.启动scheduler服务
systemctl daemon-reload
systemctl enable --now kube-scheduler
systemctl  status kube-scheduler
ss -ntl | grep 10259


### 十三.创建Bootstrapping自动颁发kubelet证书配置
1.k8s-master01节点创建bootstrap-kubelet.kubeconfig文件
温馨提示:
	- "--server"只想的是负载均衡器的IP地址，由负载均衡器对master节点进行反向代理哟。
	- "--token"也可以自定义，但也要同时修改"bootstrap"的Secret的"token-id"和"token-secret"对应值哟;

1) 设置集群
kubectl config set-cluster k8s-cluster01 \
  --certificate-authority=/k8s/certs/kubernetes/k8s-ca.pem \
  --embed-certs=true \
  --server=https://192.168.31.10:6443 \
  --kubeconfig=/k8s/certs/kubeconfig/bootstrap-kubelet.kubeconfig

2) 创建用户
kubectl config set-credentials tls-bootstrap-token-user  \
  --token=pillar.jasonshimanongfu \
  --kubeconfig=/k8s/certs/kubeconfig/bootstrap-kubelet.kubeconfig
  
3) 将集群和用户进行绑定
kubectl config set-context tls-bootstrap-token-user@kubernetes \
  --cluster=k8s-cluster01 \
  --user=tls-bootstrap-token-user \
  --kubeconfig=/k8s/certs/kubeconfig/bootstrap-kubelet.kubeconfig
  
4) 配置默认的上下文
kubectl config use-context tls-bootstrap-token-user@kubernetes \
  --kubeconfig=/k8s/certs/kubeconfig/bootstrap-kubelet.kubeconfig


5) 拷贝kube-admin.kubeconfig > /root/.kube
[root@k8s-master01 ~]#  mkdir -p /root/.kube
[root@k8s-master01 ~]#  cp /k8s/certs/kubeconfig/kube-admin.kubeconfig /root/.kube/config

6) 查看master组件，该组件官方在1.19+版本开始弃用，但是在1.30.2依旧没有移除哟~
[root@k8s-master01 ~]# kubectl get cs
Warning: v1 ComponentStatus is deprecated in v1.19+
NAME                 STATUS    MESSAGE   ERROR
scheduler            Healthy   ok        
controller-manager   Healthy   ok        
etcd-0               Healthy   ok        
[root@k8s-master01 ~]# 

7) 查看集群状态，如果未来cs组件移除了也没关系，我们可以使用"cluster-info"子命令查看集群状态
[root@k8s-master01 ~]# kubectl cluster-info 
Kubernetes control plane is running at https://192.168.31.10:6443
To further debug and diagnose cluster problems, use 'kubectl cluster-info dump'.
[root@k8s-master01 ~]# 

3.创建bootstrap-secret授权
1) 创建配bootstrap-secret文件用于授权
[root@k8s-master01 ~]# cat > bootstrap-secret.yaml <<EOF
apiVersion: v1
kind: Secret
metadata:
  name: bootstrap-token-pillar
  namespace: kube-system
type: bootstrap.kubernetes.io/token
stringData:
  description: "The default bootstrap token generated by 'kubelet '."
  token-id: pillar
  token-secret: jasonshimanongfu
  usage-bootstrap-authentication: "true"
  usage-bootstrap-signing: "true"
  auth-extra-groups:  system:bootstrappers:default-node-token,system:bootstrappers:worker,system:bootstrappers:ingress

---

apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  name: kubelet-bootstrap
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: ClusterRole
  name: system:node-bootstrapper
subjects:

- apiGroup: rbac.authorization.k8s.io
  kind: Group
  name: system:bootstrappers:default-node-token

---

apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  name: node-autoapprove-bootstrap
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: ClusterRole
  name: system:certificates.k8s.io:certificatesigningrequests:nodeclient
subjects:

- apiGroup: rbac.authorization.k8s.io
  kind: Group
  name: system:bootstrappers:default-node-token

---

apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  name: node-autoapprove-certificate-rotation
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: ClusterRole
  name: system:certificates.k8s.io:certificatesigningrequests:selfnodeclient
subjects:

- apiGroup: rbac.authorization.k8s.io
  kind: Group
  name: system:nodes

---

apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  annotations:
    rbac.authorization.kubernetes.io/autoupdate: "true"
  labels:
    kubernetes.io/bootstrapping: rbac-defaults
  name: system:kube-apiserver-to-kubelet
rules:

  - apiGroups:
    - ""
    resources:
    - nodes/proxy
    - nodes/stats
    - nodes/log
    - nodes/spec
    - nodes/metrics
    verbs:
    - "*"

---

apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  name: system:kube-apiserver
  namespace: ""
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: ClusterRole
  name: system:kube-apiserver-to-kubelet
subjects:

  - apiGroup: rbac.authorization.k8s.io
    kind: User
    name: kube-apiserver
EOF

2.应用bootstrap-secret配置文件
[root@k8s-master01 ~]# kubectl apply -f bootstrap-secret.yaml 
secret/bootstrap-token-pillar created
clusterrolebinding.rbac.authorization.k8s.io/kubelet-bootstrap created
clusterrolebinding.rbac.authorization.k8s.io/node-autoapprove-bootstrap created
clusterrolebinding.rbac.authorization.k8s.io/node-autoapprove-certificate-rotation created
clusterrole.rbac.authorization.k8s.io/system:kube-apiserver-to-kubelet created
clusterrolebinding.rbac.authorization.k8s.io/system:kube-apiserver created
[root@k8s-master01 ~]# 


### 十四.部署worker节点之kubelet启动实战
1.复制证书
1) k8s-master01节点分发证书到其他节点
cd /k8s/certs/
for NODE in k8s-node01; do
   echo $NODE
   ssh $NODE "mkdir -p /k8s/certs/kube{config,rnetes}"
   for FILE in k8s-ca.pem k8s-ca-key.pem front-proxy-ca.pem; do
     scp kubernetes/$FILE $NODE:/k8s/certs/kubernetes/${FILE}
 done
   scp kubeconfig/bootstrap-kubelet.kubeconfig $NODE:/k8s/certs/kubeconfig/
done

2) node节点进行验证
[root@k8s-worker05 ~]# ll /k8s/ -R
/k8s/:
total 0
drwxr-xr-x 4 root root 42 Nov  5 16:27 certs

/k8s/certs:
total 0
drwxr-xr-x 2 root root 42 Nov  5 16:27 kubeconfig
drwxr-xr-x 2 root root 72 Nov  5 16:27 kubernetes

/k8s/certs/kubeconfig:
total 4
-rw------- 1 root root 2243 Nov  5 16:27 bootstrap-kubelet.kubeconfig

/k8s/certs/kubernetes:
total 12
-rw-r--r-- 1 root root 1094 Nov  5 16:27 front-proxy-ca.pem
-rw------- 1 root root 1675 Nov  5 16:27 k8s-ca-key.pem
-rw-r--r-- 1 root root 1363 Nov  5 16:27 k8s-ca.pem
[root@k8s-worker05 ~]# 


2.启动kubelet服务
温馨提示:
	- 在"10-kubelet.con"文件中使用"--kubeconfig"指定的"kubelet.kubeconfig"文件并不存在，这个证书文件后期会自动生成;
	- 对于"clusterDNS"是NDS地址，我们可以自定义，比如"10.200.0.254";
	- “clusterDomain”对应的是域名信息，要和我们设计的集群保持一致，比如"yinzhengjie.com";
	- "10-kubelet.conf"文件中的"ExecStart="需要写2次，否则可能无法启动kubelet;
	
具体实操:
1) 所有节点创建工作目录
mkdir -p /var/lib/kubelet /var/log/kubernetes /etc/systemd/system/kubelet.service.d /etc/kubernetes/manifests/

2) 所有节点创建kubelet的配置文件
cat > /etc/kubernetes/kubelet-conf.yml <<'EOF'
apiVersion: kubelet.config.k8s.io/v1beta1
kind: KubeletConfiguration
address: 0.0.0.0
port: 10250
readOnlyPort: 10255
authentication:
  anonymous:
    enabled: false
  webhook:
    cacheTTL: 2m0s
    enabled: true
  x509:
    clientCAFile: /k8s/certs/kubernetes/k8s-ca.pem
authorization:
  mode: Webhook
  webhook:
    cacheAuthorizedTTL: 5m0s
    cacheUnauthorizedTTL: 30s
cgroupDriver: systemd
cgroupsPerQOS: true
clusterDNS:
- 10.200.0.254
clusterDomain: cluster.local
containerLogMaxFiles: 5
containerLogMaxSize: 10Mi
contentType: application/vnd.kubernetes.protobuf
cpuCFSQuota: true
cpuManagerPolicy: none
cpuManagerReconcilePeriod: 10s
enableControllerAttachDetach: true
enableDebuggingHandlers: true
enforceNodeAllocatable:
- pods
eventBurst: 10
eventRecordQPS: 5
evictionHard:
  imagefs.available: 15%
  memory.available: 100Mi
  nodefs.available: 10%
  nodefs.inodesFree: 5%
evictionPressureTransitionPeriod: 5m0s
failSwapOn: true
fileCheckFrequency: 20s
hairpinMode: promiscuous-bridge
healthzBindAddress: 127.0.0.1
healthzPort: 10248
httpCheckFrequency: 20s
imageGCHighThresholdPercent: 85
imageGCLowThresholdPercent: 80
imageMinimumGCAge: 2m0s
iptablesDropBit: 15
iptablesMasqueradeBit: 14
kubeAPIBurst: 10
kubeAPIQPS: 5
makeIPTablesUtilChains: true
maxOpenFiles: 1000000
maxPods: 110
nodeStatusUpdateFrequency: 10s
oomScoreAdj: -999
podPidsLimit: -1
registryBurst: 10
registryPullQPS: 5
resolvConf: /etc/resolv.conf
rotateCertificates: true
runtimeRequestTimeout: 2m0s
serializeImagePulls: true
staticPodPath: /etc/kubernetes/manifests
streamingConnectionIdleTimeout: 4h0m0s
syncFrequency: 1m0s
volumeStatsAggPeriod: 1m0s
EOF


3) 所有节点配置kubelet service
cat >  /etc/systemd/system/kubelet.service <<'EOF'
[Unit]
Description=Pillar's Kubernetes Kubelet
Documentation=https://github.com/kubernetes/kubernetes
After=containerd.service
Requires=containerd.service

[Service]
ExecStart=/usr/local/bin/kubelet
Restart=always
StartLimitInterval=0
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF


4) 所有节点配置kubelet service的配置文件
cat > /etc/systemd/system/kubelet.service.d/10-kubelet.conf <<'EOF'
[Service]
Environment="KUBELET_KUBECONFIG_ARGS=--bootstrap-kubeconfig=/k8s/certs/kubeconfig/bootstrap-kubelet.kubeconfig --kubeconfig=/k8s/certs/kubeconfig/kubelet.kubeconfig"
Environment="KUBELET_CONFIG_ARGS=--config=/etc/kubernetes/kubelet-conf.yml"
Environment="KUBELET_SYSTEM_ARGS=--container-runtime-endpoint=unix:///run/containerd/containerd.sock"
Environment="KUBELET_EXTRA_ARGS=--node-labels=node.kubernetes.io/node='' "
ExecStart=
ExecStart=/usr/local/bin/kubelet $KUBELET_KUBECONFIG_ARGS $KUBELET_CONFIG_ARGS $KUBELET_SYSTEM_ARGS $KUBELET_EXTRA_ARGS
EOF


5) 启动所有节点kubelet
systemctl daemon-reload
systemctl enable --now kubelet
systemctl status kubelet


6) 在所有master节点上查看nodes信息。
[root@k8s-master01 certs]# kubectl get nodes
NAME           STATUS     ROLES    AGE   VERSION
k8s-master01   NotReady   <none>   6s    v1.30.2
k8s-master02   NotReady   <none>   5s    v1.30.2
k8s-master03   NotReady   <none>   6s    v1.30.2
k8s-worker04   NotReady   <none>   6s    v1.30.2
k8s-worker05   NotReady   <none>   6s    v1.30.2
[root@k8s-master01 certs]# 


7) 可以查看到有相应的csr用户客户端的证书请求
[root@k8s-master01 ~]# kubectl get csr
NAME        AGE    SIGNERNAME                                    REQUESTOR                 REQUESTEDDURATION   CONDITION
csr-5j4xx   110s   kubernetes.io/kube-apiserver-client-kubelet   system:bootstrap:pillar   <none>              Approved,Issued
csr-9cmsh   110s   kubernetes.io/kube-apiserver-client-kubelet   system:bootstrap:pillar   <none>              Approved,Issued
csr-ght4f   110s   kubernetes.io/kube-apiserver-client-kubelet   system:bootstrap:pillar   <none>              Approved,Issued
csr-v6sbq   111s   kubernetes.io/kube-apiserver-client-kubelet   system:bootstrap:pillar   <none>              Approved,Issued
csr-xcq44   110s   kubernetes.io/kube-apiserver-client-kubelet   system:bootstrap:pillar   <none>              Approved,Issued
[root@k8s-master01 ~]# 

3.出现错误解决方案
温馨提示：
	如果出现报错：
nodes is forbidden: User \"system:anonymous\" cannot create resource \"nodes\" in API group \"\" at the cluster scope" node="k8s-master01"


解决方案:
[root@k8s-master03 ~]# cat test-rbac.yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  name: yinzhengjie-kubelet-rbac
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: ClusterRole
  name: cluster-admin
subjects:
- apiGroup: rbac.authorization.k8s.io
  kind: User
  name: system:anonymous
[root@k8s-master03 ~]# 
[root@k8s-master03 ~]# kubectl apply -f test-rbac.yaml
clusterrolebinding.rbac.authorization.k8s.io/k8s-kubelet-rbac created
[root@k8s-master03 ~]# 


### 十五.部署worker节点之kube-proxy服务
1.生成kube-proxy的csr文件
[root@k8s-master01 pki]# cat > kube-proxy-csr.json  <<EOF
{
  "CN": "system:kube-proxy",
  "key": {
    "algo": "rsa",
    "size": 2048
  },
  "names": [
    {
      "C": "CN",
      "ST": "Guangzhou",
      "L": "Guangzhou",
      "O": "system:kube-proxy",
      "OU": "Kubernetes-manual"
    }
  ]
}
EOF

2.创建kube-proxy需要的证书文件
[root@k8s-master01 pki]# cfssl gencert \
-ca=/k8s/certs/kubernetes/k8s-ca.pem \
-ca-key=/k8s/certs/kubernetes/k8s-ca-key.pem \
-config=k8s-ca-config.json \
-profile=kubernetes \
kube-proxy-csr.json | cfssljson -bare /k8s/certs/kubernetes/kube-proxy


[root@k8s-master01 pki]# ll /k8s/certs/kubernetes/kube-proxy*
-rw-r--r-- 1 root root 1045 Jun 24 17:53 /k8s/certs/kubernetes/kube-proxy.csr
-rw------- 1 root root 1679 Jun 24 17:53 /k8s/certs/kubernetes/kube-proxy-key.pem
-rw-r--r-- 1 root root 1464 Jun 24 17:53 /k8s/certs/kubernetes/kube-proxy.pem
[root@k8s-master01 pki]# 

3.设置集群
[root@k8s-master01 pki]# kubectl config set-cluster k8s-cluster01 \
  --certificate-authority=/k8s/certs/kubernetes/k8s-ca.pem \
  --embed-certs=true \
  --server=https://192.168.31.10:6443 \
  --kubeconfig=/k8s/certs/kubeconfig/kube-proxy.kubeconfig

4.设置一个用户项
[root@k8s-master01 pki]# kubectl config set-credentials system:kube-proxy \
  --client-certificate=/k8s/certs/kubernetes/kube-proxy.pem \
  --client-key=/k8s/certs/kubernetes/kube-proxy-key.pem \
  --embed-certs=true \
  --kubeconfig=/k8s/certs/kubeconfig/kube-proxy.kubeconfig

5.设置一个上下文环境
[root@k8s-master01 pki]# kubectl config set-context kube-proxy@kubernetes \
  --cluster=k8s-cluster01 \
  --user=system:kube-proxy \
  --kubeconfig=/k8s/certs/kubeconfig/kube-proxy.kubeconfig

6.使用默认的上下文
[root@k8s-master01 pki]# kubectl config use-context kube-proxy@kubernetes \
  --kubeconfig=/k8s/certs/kubeconfig/kube-proxy.kubeconfig

7.将kube-proxy的systemd Service文件发送到其他节点
for NODE in k8s-node01; do
     echo $NODE
     scp /k8s/certs/kubeconfig/kube-proxy.kubeconfig $NODE:/k8s/certs/kubeconfig/
done

8.所有节点创建kube-proxy.conf配置文件
cat > /etc/kubernetes/kube-proxy.yml << EOF
apiVersion: kubeproxy.config.k8s.io/v1alpha1
kind: KubeProxyConfiguration
bindAddress: 0.0.0.0
metricsBindAddress: 127.0.0.1:10249
clientConnection:
  acceptConnection: ""
  burst: 10
  contentType: application/vnd.kubernetes.protobuf
  kubeconfig: /k8s/certs/kubeconfig/kube-proxy.kubeconfig
  qps: 5
clusterCIDR: 172.16.0.0/16
configSyncPeriod: 15m0s
conntrack:
  max: null
  maxPerCore: 32768
  min: 131072
  tcpCloseWaitTimeout: 1h0m0s
  tcpEstablishedTimeout: 24h0m0s
enableProfiling: false
healthzBindAddress: 0.0.0.0:10256
hostnameOverride: ""
iptables:
  masqueradeAll: false
  masqueradeBit: 14
  minSyncPeriod: 0s
ipvs:
  masqueradeAll: true
  minSyncPeriod: 5s
  scheduler: "rr"
  syncPeriod: 30s
mode: "ipvs"
nodeProtAddress: null
oomScoreAdj: -999
portRange: ""
udpIdelTimeout: 250ms
EOF

9.所有节点使用systemd管理kube-proxy
cat > /etc/systemd/system/kube-proxy.service << EOF
[Unit]
Description=Pillar's Kubernetes Proxy
After=network.target

[Service]
ExecStart=/usr/local/bin/kube-proxy \
  --config=/etc/kubernetes/kube-proxy.yml \
  --v=2 
Restart=on-failure
LimitNOFILE=65536

[Install]
WantedBy=multi-user.target
EOF

10.所有节点启动kube-proxy
systemctl daemon-reload && systemctl enable --now kube-proxy
systemctl status kube-proxy
ss -ntl |grep 10249

十六.网络插件calico部署案例
1.下载资源清单
参考链接:
	https://docs.tigera.io/calico/latest/getting-started/kubernetes/quickstart

[root@k8s-master02 ~]# wget https://raw.githubusercontent.com/projectcalico/calico/v3.28.0/manifests/tigera-operator.yaml
[root@k8s-master02 ~]# wget https://raw.githubusercontent.com/projectcalico/calico/v3.28.0/manifests/custom-resources.yaml

2.根据自己的K8S情况修改Pod网段
[root@k8s-master02 ~]# grep cidr custom-resources.yaml 
      cidr: 192.168.0.0/16
[root@k8s-master02 ~]# 
[root@k8s-master02 ~]# sed -i '/cidr/s#192.168#10.100#' custom-resources.yaml 
[root@k8s-master02 ~]# 
[root@k8s-master02 ~]# grep cidr custom-resources.yaml 
      cidr: 10.100.0.0/16
[root@k8s-master02 ~]# 

3.部署calico
[root@k8s-master02 ~]# kubectl create -f tigera-operator.yaml 
[root@k8s-master02 ~]# 
[root@k8s-master02 ~]# kubectl create -f custom-resources.yaml 
[root@k8s-master02 ~]# 

4.查看calico是否部署成功
[root@k8s-master01 pki]# kubectl get pods -A -o wide
NAMESPACE         NAME                               READY   STATUS             RESTARTS   AGE    IP           NODE           NOMINATED NODE   READINESS GATES
calico-system     calico-typha-648d54556d-7g28d      0/1     ImagePullBackOff   0          107s   10.0.0.245   k8s-worker05   <none>           <none>
calico-system     calico-typha-648d54556d-b6wpx      0/1     ImagePullBackOff   0          116s   10.0.0.243   k8s-master03   <none>           <none>
calico-system     calico-typha-648d54556d-xtmrx      0/1     ImagePullBackOff   0          107s   192.168.31.10   k8s-master01   <none>           <none>
tigera-operator   tigera-operator-76ff79f7fd-9rxtr   1/1     Running            0          6m7s   10.0.0.242   k8s-master02   <none>           <none>
[root@k8s-master01 pki]# 


温馨提示:
	可能会出现镜像下载失败的情况，因此需要手动拉取镜像！
5.卸载calico
[root@k8s-master02 ~]# kubectl delete -f custom-resources.yaml  -f  tigera-operator.yaml 
​

十七.网络插件falnnel部署案例
1.导入镜像
[root@k8s-master01 ~]# wget http://192.168.18.253/Docker/images/Kubernetes/K8S%20Cluster/k8s-flannel-v1.4.1.tar.gz
[root@k8s-master01 ~]#
[root@k8s-master01 ~]# ctr -n k8s.io i import yinzhengjie-flannel-v1.4.1.tar.gz 

温馨提示:
	此步骤可跳过，因为是我线下下载好了镜像直接导入的。
2.下载资源清单
[root@k8s-master01 ~]# wget https://github.com/flannel-io/flannel/releases/latest/download/kube-flannel.yml
3.修改资源清单
[root@k8s-master01 ~]# grep 16 kube-flannel.yml 
    "Network": "10.244.0.0/16",
[root@k8s-master01 ~]# 
[root@k8s-master01 ~]# sed -i '/Network/s#244#100#' kube-flannel.yml 
[root@k8s-master01 ~]# 
[root@k8s-master01 ~]# grep 16 kube-flannel.yml 
    "Network": "10.100.0.0/16",
[root@k8s-master01 ~]# 
[root@k8s-master01 ~]# grep image kube-flannel.yml 
      image: docker.io/flannel/flannel:v0.25.4
      image: docker.io/flannel/flannel-cni-plugin:v1.4.1-flannel1
      image: docker.io/flannel/flannel:v0.25.4
[root@k8s-master01 ~]# 
[root@k8s-master01 ~]#  
[root@k8s-master01 ~]# sed -i 's#docker.io/flannel/flannel:v0.25.4#docker.io/flannel/flannel:v0.25.3#' kube-flannel.yml 
[root@k8s-master01 ~]# 
[root@k8s-master01 ~]# grep image kube-flannel.yml 
      image: docker.io/flannel/flannel:v0.25.3
      image: docker.io/flannel/flannel-cni-plugin:v1.4.1-flannel1
      image: docker.io/flannel/flannel:v0.25.3
[root@k8s-master01 ~]# 
4.部署Flannel
[root@k8s-master01 ~]# kubectl apply -f kube-flannel.yml 
5.查看flannel 组件
[root@k8s-master01 ~]# kubectl get pods -A -o wide
NAMESPACE      NAME                    READY   STATUS    RESTARTS   AGE   IP           NODE           NOMINATED NODE   READINESS GATES
kube-flannel   kube-flannel-ds-7f7mh   1/1     Running   0          30s   10.0.0.243   k8s-master03   <none>           <none>
kube-flannel   kube-flannel-ds-lr5ww   1/1     Running   0          30s   10.0.0.242   k8s-master02   <none>           <none>
kube-flannel   kube-flannel-ds-nspgw   1/1     Running   0          30s   10.0.0.245   k8s-worker05   <none>           <none>
kube-flannel   kube-flannel-ds-sscjc   1/1     Running   0          30s   192.168.31.10   k8s-master01   <none>           <none>
kube-flannel   kube-flannel-ds-vsh6s   1/1     Running   0          30s   10.0.0.244   k8s-worker04   <none>           <none>
[root@k8s-master01 ~]# 
6.查看集群是否正常
[root@k8s-master01 ~]# kubectl get nodes
NAME           STATUS   ROLES    AGE   VERSION
k8s-master01   Ready    <none>   49m   v1.30.2
k8s-master02   Ready    <none>   49m   v1.30.2
k8s-master03   Ready    <none>   49m   v1.30.2
k8s-worker04   Ready    <none>   49m   v1.30.2
k8s-worker05   Ready    <none>   49m   v1.30.2
[root@k8s-master01 ~]# 
7.配置自动补全功能
kubectl completion bash > ~/.kube/completion.bash.inc
echo "source '$HOME/.kube/completion.bash.inc'" >> $HOME/.bashrc
source $HOME/.bashrc
8.启动deployment资源测试
cat > deploy-apps.yaml  <<EOF
apiVersion: apps/v1
kind: Deployment
metadata:
  name: yinzhengjie-app01
spec:
  replicas: 1
  selector:
    matchLabels:
      apps: v1 
  template:
    metadata:
      labels:
        apps: v1
    spec:
      nodeName: k8s-worker04
      containers:
      - name: c1
        image: registry.cn-hangzhou.aliyuncs.com/k8s-k8s/apps:v1 

---

apiVersion: apps/v1
kind: Deployment
metadata:
  name: yinzhengjie-app02
spec:
  replicas: 1
  selector:
    matchLabels:
      apps: v1 
  template:
    metadata:
      labels:
        apps: v1
    spec:
      nodeName: k8s-worker05
      containers:
      - name: c1
        image: registry.cn-hangzhou.aliyuncs.com/k8s-k8s/apps:v2
EOF
9.验证Pod是否可以正常访问
[root@k8s-master01 ~]# kubectl get pods -o wide
NAME                               READY   STATUS    RESTARTS   AGE     IP           NODE           NOMINATED NODE   READINESS GATES
yinzhengjie-app01-5bc547f66f-mmdjj   1/1     Running   0          5m59s   10.100.3.2   k8s-worker04   <none>           <none>
yinzhengjie-app02-6d44ccd76f-nv4v4   1/1     Running   0          5m58s   10.100.0.2   k8s-worker05   <none>           <none>
[root@k8s-master01 ~]# 
[root@k8s-master01 ~]# curl 10.100.3.2 

<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8"/>
    <title>yinzhengjie apps v1</title>
    <style>
       div img {
          width: 900px;
          height: 600px;
          margin: 0;
       }
    </style>
  </head>


  <body>
    <h1 style="color: green">凡人修仙传 v1 </h1>
    <div>
      <img src="1.jpg">
    <div>
  </body>

</html>
[root@k8s-master01 ~]# 
[root@k8s-master01 ~]# curl 10.100.0.2 

<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8"/>
    <title>yinzhengjie apps v2</title>
    <style>
       div img {
          width: 900px;
          height: 600px;
          margin: 0;
       }
    </style>
  </head>


  <body>
    <h1 style="color: red">凡人修仙传 v2 </h1>
    <div>
      <img src="2.jpg">
    <div>
  </body>

</html>
[root@k8s-master01 ~]# 
10.删除资源
[root@k8s-master03 ~]# kubectl delete -f deploy-apps.yaml 


11.出现错误解决方案
温馨提示：
	如果报错:
  Warning  FailedCreatePodSandBox  72s                kubelet  Failed to create pod sandbox: rpc error: code = Unknown desc = failed to setup network for sandbox "8f179d59d32bf02a1e63ef23b110ac4bee9813d8652b8625d8e899edbf126e19": plugin type="loopback" failed (add): failed to find plugin "loopback" in path [/opt/cni/bin]
  Normal   SandboxChanged          15s (x6 over 71s)  kubelet  Pod sandbox changed, it will be killed and re-created.


解决方案:
mkdir -p /opt/cni/bin
curl -O -L https://github.com/containernetworking/plugins/releases/download/v1.2.0/cni-plugins-linux-amd64-v1.2.0.tgz
tar -C /opt/cni/bin -xzf cni-plugins-linux-amd64-v1.2.0.tgz

SVIP:
wget http://192.168.18.253/Linux91/Kubernetes/day14-/softwares/cni-plugins-linux-amd64-v1.2.0.tgz
tar -C /opt/cni/bin -xzf cni-plugins-linux-amd64-v1.2.0.tgz
十八.今日内容回顾及作业
今日内容回顾:
	- K8S生产环境中高可用集群架构设计图解;
   - containerd环境搭建;
   - containerd的基础命令使用;
   - etcd高可用集群构建及验证;
   - cfssl证书，kubeconfig等管理;
   - apiServer,controller-manager,scheduler,kubelet,kube-proxy启动脚本编写，配置文件生成及启动;
   - CNI插件部署;
   - 测试集群是否正常及故障排查;

今日作业:
	 - 完成课堂的所有练习并整理思维导图;

扩展作业:
	 - 完成dashboard，coreDNS，metrics-server，helm等组件的部署;