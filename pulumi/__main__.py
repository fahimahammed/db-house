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

# Configuration for 3 subnets in different Availability Zones
subnets_config = [
    {"name": "public-subnet-1", "cidr": "10.0.1.0/24", "az": "ap-southeast-1a"},
    {"name": "public-subnet-2", "cidr": "10.0.2.0/24", "az": "ap-southeast-1b"},
    {"name": "public-subnet-3", "cidr": "10.0.3.0/24", "az": "ap-southeast-1c"},
]

# 4. Create Security Group for EC2 instances
sec_group = aws.ec2.SecurityGroup(
    "instance-sg",
    vpc_id=vpc.id,
    description="Allow SSH and HTTP access",
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
key_name = "MyKeyPair"

# 5. Create 3 Subnets, associate them with Route Table, and launch an EC2 instance in each
created_subnets = []
created_instances = []

for idx, config in enumerate(subnets_config, start=1):
    # Create Subnet
    subnet = aws.ec2.Subnet(
        config["name"],
        vpc_id=vpc.id,
        cidr_block=config["cidr"],
        availability_zone=config["az"],
        map_public_ip_on_launch=True,
        tags={"Name": config["name"]},
    )
    created_subnets.append(subnet)

    # Associate Subnet with Route Table
    aws.ec2.RouteTableAssociation(
        f"{config['name']}-rta",
        subnet_id=subnet.id,
        route_table_id=route_table.id,
    )

    # Launch EC2 Instance in this Subnet
    instance = aws.ec2.Instance(
        f"ec2-instance-{idx}",
        instance_type="t2.micro",
        ami=ami_id,
        subnet_id=subnet.id,
        vpc_security_group_ids=[sec_group.id],
        key_name=key_name,
        associate_public_ip_address=True,
        tags={"Name": f"ec2-instance-{idx}"},
    )
    created_instances.append(instance)

    # Export Subnet and EC2 outputs
    pulumi.export(f"subnet_{idx}_id", subnet.id)
    pulumi.export(f"instance_{idx}_id", instance.id)
    pulumi.export(f"instance_{idx}_public_ip", instance.public_ip)

# Export VPC, IGW, and Route Table outputs
pulumi.export("vpc_id", vpc.id)
pulumi.export("igw_id", igw.id)
pulumi.export("route_table_id", route_table.id)

