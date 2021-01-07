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

const NODE_SIZE = 5;

const DIRECTORY_GEOMETRY = new THREE.BoxGeometry(NODE_SIZE, NODE_SIZE, NODE_SIZE);
const DIRECTORY_MATERIAL = new THREE.MeshBasicMaterial( { color: 0x15384a } );

var FILE_GEOMETRY = new THREE.SphereGeometry(NODE_SIZE / 2);
var FILE_MATERIAL = new THREE.MeshBasicMaterial( { color: 0x3bd163 } );

const LINE_MATERIAL = new THREE.LineBasicMaterial( { color: 0xff0000 } );
const WIREFRAME_MATERIAL = new THREE.LineBasicMaterial( { color: 0xff0000 } );

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

function make_node_mesh(scene, node, node_size, x, y, z) {
	if (node.type === NodeType.Directory) {
		var node_mesh = new THREE.Mesh(DIRECTORY_GEOMETRY, DIRECTORY_MATERIAL);
	}
	else if (node.type === NodeType.File) {
		var node_mesh = new THREE.Mesh(FILE_GEOMETRY, FILE_MATERIAL);
	}
	
	node_mesh.position.x = x;
	node_mesh.position.y = y;
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
	
	return node_mesh;
}

function make_geometry(scene, node, x, z) {
	const node_size = 5;
	const x_gap = node_size * 10 / node.children.length;
	const z_gap = node_size * 5;
	
	const node_mesh = make_node_mesh(scene, node, node_size, x, 0, z);
	
	let i = 0;
	let sign = 1;
	let next_child_z = z - z_gap + node_mesh.position.z;
	for (const child of node.children) {
		let next_child_x = sign * (x_gap * i + child.children.length * node_size) + node_mesh.position.x;
		
		const line_points = [];
		line_points.push(node_mesh.position);
		line_points.push(new THREE.Vector3(next_child_x, 0, next_child_z));
		
		const line_geometry = new THREE.BufferGeometry().setFromPoints(line_points);
		
		let line = new THREE.Line(line_geometry, LINE_MATERIAL);
		scene.add(line);
		
		make_geometry(scene, child, next_child_x, next_child_z);
		i++;
		sign *= -1;
	}
}

function make_interactive_geometry(scene, node, pointer) {
	const node_size = 5;
	
	make_node_mesh(scene, node, node_size, 0, 0, 0);
	
	let i = 0;
	const x_gap = node_size * 5;
	const start_x = -1 * x_gap * (node.children.length - 1) / 2;
	for (const child of node.children) {
		let x = start_x + x_gap * i;
		let child_mesh = make_node_mesh(scene, child, node_size, x, 0, -5 * node_size);
		
		// highlight if selected
		if (pointer == i) {
			const wireframe_geometry = new THREE.WireframeGeometry(child_mesh.geometry);
			const wireframe_line = new THREE.LineSegments(wireframe_geometry, WIREFRAME_MATERIAL);
			wireframe_line.material.depthTest = false;
			wireframe_line.material.opacity = 0.25;
			wireframe_line.material.transparent = true;
			wireframe_line.position.x = child_mesh.position.x;
			wireframe_line.position.y = child_mesh.position.y;
			wireframe_line.position.z = child_mesh.position.z;
			scene.add(wireframe_line);
		}
		
		i++;
	}
}

function clear_three_object(three_object) {
	while(three_object.children.length > 0) { 
		clear_three_object(three_object.children[0]);
		three_object.remove(three_object.children[0]);
	}
	
	if(three_object.geometry)
		three_object.geometry.dispose();

	if(three_object.material)
		three_object.material.dispose();
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
	
	const renderer = new THREE.WebGLRenderer({antialias : true});
	renderer.setSize(window.innerWidth, window.innerHeight);
	renderer.setClearColor(0x4B5A20, 1.0);
	document.body.appendChild(renderer.domElement);
	
	const controls = new THREE.OrbitControls(camera, renderer.domElement);
	
	camera.position.z = 50;
	camera.position.y = 50;
	
	make_geometry(scene, root_node, 0, 0);
	
	const interactive_scene = new THREE.Scene();
	
	var interactive_mode_enabled = false;
	var interactive_current_node = root_node;
	var interactive_pointer = 0;
	var interactive_updated = false;
	
	document.addEventListener('keyup', function(event) {
		interactive_updated = true;
		// f
		if(event.keyCode == 70) {
			interactive_mode_enabled = !interactive_mode_enabled;
		}
		
		// s
		else if(event.keyCode == 83) {
			if (interactive_current_node !== root_node) {
				interactive_current_node = interactive_current_node.root;
			}
		}
		// w
		else if(event.keyCode == 87) {
			if (interactive_pointer < interactive_current_node.children.length) {
				interactive_current_node = interactive_current_node.children[interactive_pointer];
				interactive_pointer = 0;
			}
		}
		// d
		else if(event.keyCode == 68) {
			if (interactive_pointer + 1 < interactive_current_node.children.length) {
				interactive_pointer++;
			}
			else {
				interactive_pointer = 0;
			}
		}
		// a
		else if(event.keyCode == 65) {
			if (interactive_pointer === 0) {
				if (interactive_current_node.children.length)
				interactive_pointer = interactive_current_node.children.length - 1;
			}
			else {
				interactive_pointer--;
			}
		}
	});
	
	function update_and_render() {
		requestAnimationFrame(update_and_render);
		
		// required if controls.enableDamping or controls.autoRotate are set to true
		controls.update();
		
		if (interactive_updated)
		{
			clear_three_object(interactive_scene);
			make_interactive_geometry(interactive_scene, interactive_current_node, interactive_pointer);
			interactive_updated = false;
		}
		
		if (interactive_mode_enabled)
			renderer.render(interactive_scene, camera);
		else
			renderer.render(scene, camera);
	}
	
	update_and_render();
}

init();