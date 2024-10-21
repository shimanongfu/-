# 系统环境 : ubuntu1804+
# k8s version : k8s 1.23.x
# cri docker

### 一、安装之前做好系统环境的准备(所有节点)

1) 关闭swap、防火墙ufw
swapoff -a                                          
sed -ri 's/.*swap.*/#&/' /etc/fstab                 
ufw disable                                         

2) 开启ipv4转发，配置iptables
modprobe br_netfilter

cat >> /etc/sysctl.conf << EOF
net.bridge.bridge-nf-call-ip6tables = 1
net.bridge.bridge-nf-call-iptables = 1
net.ipv4.ip_forward = 1
EOF

3) 设置主机名，并添加dns解析
hostnamectl set-hostname k8s-master
hostnamectl set-hostname k8s-node1

cat >> /etc/hosts <<EOF
10.0.24.14   k8s-master
10.0.12.3    k8s-node1
EOF

### 二、装docker、kubelet, kubeadm, kubectl(所有节点)

1) 安装依赖包
apt-get -y install apt-transport-https ca-certificates curl software-properties-common wget

2) 配置docker安装源为阿里源
curl -fsSL https://mirrors.aliyun.com/docker-ce/linux/ubuntu/gpg | sudo apt-key add -
add-apt-repository "deb [arch=amd64] https://mirrors.aliyun.com/docker-ce/linux/ubuntu $(lsb_release -cs) stable"

apt update

3) 安装dokcer

apt install docker-ce

4) 配置docker加速镜像源（可以自己去阿里云注册）

cat > /etc/docker/daemon.json <<EOF
{
  "exec-opts": ["native.cgroupdriver=systemd"],
  "registry-mirrors": ["https://hdyv653j.mirror.aliyuncs.com"]
}
EOF

systemctl daemon-reload                                
systemctl restart docker 

5) 添加k8s安装源为阿里源
curl -s https://mirrors.aliyun.com/kubernetes/apt/doc/apt-key.gpg | sudo apt-key add -

cat > /etc/apt/sources.list.d/kubernetes.list <<EOF
deb https://mirrors.aliyun.com/kubernetes/apt/ kubernetes-xenial main
EOF

apt update

6) 安装kubelet, kubeadm, kubectl

apt-get install -y kubelet=1.23.15-00 kubeadm=1.23.15-00 kubectl=1.23.15-00

### 三、初始化集群

1) master节点初始化
kubeadm init \
  --apiserver-advertise-address=10.0.24.14 \
  --image-repository registry.aliyuncs.com/google_containers \
  --kubernetes-version v1.23.15 \
  --service-cidr=172.16.0.0/12 \
  --pod-network-cidr=192.168.0.0/16 \
  --ignore-preflight-errors=all

  mkdir -p $HOME/.kube
  sudo cp -i /etc/kubernetes/admin.conf $HOME/.kube/config
  sudo chown $(id -u):$(id -g) $HOME/.kube/config

  2) 安装网络插件(calico、flannel)

  3) 添加node节点
  kubeadm join 10.0.24.14:6443 --token hdt5ph.e0pljepkdliokjbk \
	--discovery-token-ca-cert-hash sha256:edf9e87486b6f0ba139bcdbd54e19be8beb4282214c2727881aebd5875d9717b
