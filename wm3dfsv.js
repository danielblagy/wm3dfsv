const NodeType = {
	Directory : 1,
	File : 2
};
Object.freeze(NodeType);

class Node {
	constructor(name, root, children, type) {
		this.name = name;
		this.root = root;
		this.children = children;
		this.type = type;
	}
}

function init()
{
	var input = document.getElementById("file-picker");
	
	input.onchange = e => { 
	   	var files = e.target.files;
	   	console.log(files);
	   	input.remove();
	   	start(files);
	}
}

function create_node(current_node, dirs, count, length) {
	let found = false;
	
	var i;
	for (i = 0; i < current_node.children.length; i++) {
		if (current_node.children[i].name === dirs[count]) {
			found = true;
			break;
		}
	}
	
	if (found)
		current_node = current_node.children[i];
	else {
		// if the element of dirs is the last one, it's a file, ptherwise it's a directory
		// e.g. if dirs = ['project', 'res', 'data.json'], the last element is a file (data.json),
		// others are directories
		if (count == length - 1)
			current_node.children.push(new Node(dirs[count], current_node, [], NodeType.File));
		else
			current_node.children.push(new Node(dirs[count], current_node, [], NodeType.Directory));
		
		current_node = current_node.children[current_node.children.length - 1];
	}
	
	count++;
	
	if (count < length)
		create_node(current_node, dirs, count, length);
}

function make_geometry(scene, node, x, z) {
	console.log("make_geometry call x: ", x, "  z: ", z);
	
	const node_size = 5;
	const x_gap = node_size * 5;
	const z_gap = node_size * 5;
	
	if (node.type === NodeType.Directory) {
		var geometry = new THREE.BoxGeometry(node_size, node_size, node_size);
		var material = new THREE.MeshBasicMaterial( { color: 0x15384a } );
	}
	else if (node.type === NodeType.File) {
		var geometry = new THREE.SphereGeometry(node_size / 2);
		var material = new THREE.MeshBasicMaterial( { color: 0x3bd163 } );
	}
	
	const node_mesh = new THREE.Mesh(geometry, material);
	node_mesh.position.x = x;
	node_mesh.position.z = z;
	scene.add(node_mesh);
	
	let label = new THREE.TextSprite({
		text: node.name,
		fontFamily: 'Arial, Helvetica, sans-serif',
		fontSize: node_size / 2,
		color: '#ffbbff',
	});
	
	label.position.x = node_mesh.position.x;
	label.position.y = node_mesh.position.y;
	label.position.z = node_mesh.position.z + node_size;
	scene.add(label);
	
	let i = 0;
	let sign = 1;
	for (const child of node.children) {
		//let next_child_x = sign * (x_gap * i + child.children.length * node_size);
		let next_child_x = sign * x_gap * i + node_mesh.position.x;
		let next_child_z = z - z_gap + node_mesh.position.z;
		
		const line_material = new THREE.LineBasicMaterial( { color: 0xff0000 } );
		
		const line_points = [];
		line_points.push(node_mesh.position);
		line_points.push(new THREE.Vector3(next_child_x, 0, next_child_z));
		
		const line_geometry = new THREE.BufferGeometry().setFromPoints(line_points);
		
		let line = new THREE.Line(line_geometry, line_material);
		scene.add(line);
		
		make_geometry(scene, child, next_child_x, next_child_z);
		i++;
		sign *= -1;
	}
}

function start(files) {
	var root_node = new Node(files[0]["webkitRelativePath"].split("/")[0], undefined, [], NodeType.Directory);
	
	for (const file of files) {
		let dirs = file["webkitRelativePath"].split("/");
		dirs.shift();	// remove the first element (which is a name of the root dir)
		create_node(root_node, dirs, 0, dirs.length);
	}
	
	console.log(root_node);
	
	const scene = new THREE.Scene();
	const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
	
	const renderer = new THREE.WebGLRenderer();
	renderer.setSize(window.innerWidth, window.innerHeight);
	renderer.setClearColor(0x4B5A20, 1.0);
	document.body.appendChild(renderer.domElement);
	
	const controls = new THREE.OrbitControls(camera, renderer.domElement);
	
	make_geometry(scene, root_node, 0, 0);
			
	camera.position.z = 50;
	
	// keyboard input handling
	document.addEventListener("keydown", (event) => {
		console.log(`key=${event.key},code=${event.code}`);
		console.log(camera.position);
		if (event.code == "KeyW")
			camera.position.z -= 5;
		else if (event.code == "KeyS")
		camera.position.z += 5;
	});
	
	function update_and_render() {
		requestAnimationFrame(update_and_render);
		
		//group.rotation.x += 0.01;
		//group.rotation.y += 0.035;
		//group.rotation.z -= 0.015;
		//group.position.z += 0.01;
		
		// required if controls.enableDamping or controls.autoRotate are set to true
		//controls.update();
		
		renderer.render(scene, camera);
	}
	
	update_and_render();
}

init();