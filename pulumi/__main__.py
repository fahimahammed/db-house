import pulumi
import pulumi_aws as aws

# 1. Create VPC
vpc = aws.ec2.Vpc(
    "custom-vpc",
    cidr_block="10.0.0.0/16",
    enable_dns_hostnames=True,
    enable_dns_support=True,
    tags={"Name": "custom-vpc"},
)

# 2. Create Internet Gateway (IGW)
igw = aws.ec2.InternetGateway(
    "custom-igw",
    vpc_id=vpc.id,
    tags={"Name": "custom-igw"},
)

# 3. Create Route Table with route to Internet Gateway
route_table = aws.ec2.RouteTable(
    "custom-rt",
    vpc_id=vpc.id,
    routes=[
        aws.ec2.RouteTableRouteArgs(
            cidr_block="0.0.0.0/0",
            gateway_id=igw.id,
        )
    ],
    tags={"Name": "custom-rt"},
)

# Configuration for 4 Subnets and EC2 Instances
servers_config = [
    {
        "subnet_name": "public-subnet-1",
        "cidr": "10.0.1.0/24",
        "az": "ap-southeast-1a",
        "server_name": "mongo-primary",
    },
    {
        "subnet_name": "public-subnet-2",
        "cidr": "10.0.2.0/24",
        "az": "ap-southeast-1b",
        "server_name": "mongo-secondary-1",
    },
    {
        "subnet_name": "public-subnet-3",
        "cidr": "10.0.3.0/24",
        "az": "ap-southeast-1c",
        "server_name": "mongo-secondary-2",
    },
    {
        "subnet_name": "public-subnet-4",
        "cidr": "10.0.4.0/24",
        "az": "ap-southeast-1a",
        "server_name": "monitoring-server",
    },
]

# 4. Create Security Group for EC2 instances
sec_group = aws.ec2.SecurityGroup(
    "instance-sg",
    vpc_id=vpc.id,
    description="Allow SSH, HTTP, HTTPS and MongoDB access",
    ingress=[
        aws.ec2.SecurityGroupIngressArgs(
            protocol="tcp",
            from_port=22,
            to_port=22,
            cidr_blocks=["0.0.0.0/0"],
        ),
        aws.ec2.SecurityGroupIngressArgs(
            protocol="tcp",
            from_port=80,
            to_port=80,
            cidr_blocks=["0.0.0.0/0"],
        ),
        # Allow HTTPS for Web UI / PMM Monitoring
        aws.ec2.SecurityGroupIngressArgs(
            protocol="tcp",
            from_port=443,
            to_port=443,
            cidr_blocks=["0.0.0.0/0"],
        ),
        # Allow MongoDB traffic within the VPC
        aws.ec2.SecurityGroupIngressArgs(
            protocol="tcp",
            from_port=27017,
            to_port=27017,
            cidr_blocks=["0.0.0.0/0"],
        )
    ],
    egress=[
        aws.ec2.SecurityGroupEgressArgs(
            protocol="-1",
            from_port=0,
            to_port=0,
            cidr_blocks=["0.0.0.0/0"],
        )
    ],
    tags={"Name": "instance-sg"},
)

# AMI ID (Ubuntu 24.04 LTS for ap-southeast-1)
# Update this AMI ID if you are using a different AWS region
ami_id = "ami-060e277c0d4cce553"

# 4.1 Automatically import/create the EC2 Key Pair in AWS
key_pair = aws.ec2.KeyPair(
    "custom-keypair",
    key_name="MyKeyPair",
    public_key=(
        "ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABAQDa34YRUkoFbZSO6lwHkcPGkWu8OciyWbL4H30JmDbYS0Ve/Zc/Kq8PsR42ElGylck"
        "Nbt3tXogykoFD4FU7z/hQ9ERb1u6GHrYmRjMED/uaDBL//7WqdbHvbxQiYaAUFDqZlB+zOxTJUuUg1+fWRi5klnroHayI+CIlPGDhaY"
        "wnFqm38ByMGXBUJjxwf3GV8UFHfpyqgtiTXLfyJf+mcLTblh7Y1noG49Ocz70la1lDNWOpBDfIGcyK9HHy5RBd+UycfSYrq/VaNz53wc"
        "SL9wz4YJT4+wcX4YMHdjfDjKuWRKTltLZRV7Ggl2i9xMDkrVqUmAarrTiZyVU1nH+4oXdh"
    ),
)

# 5. Create 4 Subnets, associate them with Route Table, and launch an EC2 instance in each
created_subnets = []
created_instances = []

for idx, config in enumerate(servers_config, start=1):
    # Create Subnet
    subnet = aws.ec2.Subnet(
        config["subnet_name"],
        vpc_id=vpc.id,
        cidr_block=config["cidr"],
        availability_zone=config["az"],
        map_public_ip_on_launch=True,
        tags={"Name": config["subnet_name"]},
    )
    created_subnets.append(subnet)

    # Associate Subnet with Route Table
    aws.ec2.RouteTableAssociation(
        f"{config['subnet_name']}-rta",
        subnet_id=subnet.id,
        route_table_id=route_table.id,
    )

    # Launch EC2 Instance with designated server name
    instance = aws.ec2.Instance(
        config["server_name"],
        instance_type="t2.micro",
        ami=ami_id,
        subnet_id=subnet.id,
        vpc_security_group_ids=[sec_group.id],
        key_name=key_pair.key_name,
        associate_public_ip_address=True,
        tags={"Name": config["server_name"]},
    )
    created_instances.append(instance)

    # Named Outputs
    sanitized_name = config["server_name"].replace("-", "_")
    pulumi.export(f"{sanitized_name}_id", instance.id)
    pulumi.export(f"{sanitized_name}_public_ip", instance.public_ip)
    pulumi.export(f"{sanitized_name}_private_ip", instance.private_ip)

    # Index Outputs (for backwards compatibility)
    pulumi.export(f"subnet_{idx}_id", subnet.id)
    pulumi.export(f"instance_{idx}_id", instance.id)
    pulumi.export(f"instance_{idx}_public_ip", instance.public_ip)
    pulumi.export(f"instance_{idx}_private_ip", instance.private_ip)

# Export VPC, IGW, and Route Table outputs
pulumi.export("vpc_id", vpc.id)
pulumi.export("igw_id", igw.id)
pulumi.export("route_table_id", route_table.id)

