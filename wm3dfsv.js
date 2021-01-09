const NodeType = {
	Directory : 1,
	File : 2
};
Object.freeze(NodeType);

class Node {
	constructor(name, root, children, type, mesh) {
		this.name = name;
		this.root = root;
		this.children = children;
		this.type = type;
		this.mesh = mesh;
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
		// if the element of dirs is the last one, it's a file, otherwise it's a directory
		// e.g. if dirs = ['project', 'res', 'data.json'], the last element is a file (data.json),
		// others are directories
		if (count == length - 1)
			current_node.children.push(new Node(dirs[count], current_node, [], NodeType.File, undefined));
		else
			current_node.children.push(new Node(dirs[count], current_node, [], NodeType.Directory, undefined));
		
		current_node = current_node.children[current_node.children.length - 1];
	}
	
	count++;
	
	if (count < length)
		create_node(current_node, dirs, count, length);
}

function make_node_mesh(scene, node, node_size, x, y, z) {
	if (node.type === NodeType.Directory) {
		var node_mesh = new THREE.Mesh(DIRECTORY_GEOMETRY, DIRECTORY_MATERIAL);
		node_mesh.name = 'directory';
	}
	else if (node.type === NodeType.File) {
		var node_mesh = new THREE.Mesh(FILE_GEOMETRY, FILE_MATERIAL);
		node_mesh.name = 'file';
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
	label.position.y = node_mesh.position.y + node_size;
	label.position.z = node_mesh.position.z - node_size;
	scene.add(label);
	
	return node_mesh;
}

function make_interactive_geometry(scene, node) {
	node.mesh = make_node_mesh(scene, node, NODE_SIZE, 0, 0, 0);
	
	let i = 0;
	const x_gap = NODE_SIZE * 5;
	const start_x = -1 * x_gap * (node.children.length - 1) / 2;
	for (const child of node.children) {
		let x = start_x + x_gap * i;
		child.mesh = make_node_mesh(scene, child, NODE_SIZE, x, 0, -5 * NODE_SIZE);
		
		// highlight if selected
		/*if (pointer == i) {
			const wireframe_geometry = new THREE.WireframeGeometry(child_mesh.geometry);
			const wireframe_line = new THREE.LineSegments(wireframe_geometry, WIREFRAME_MATERIAL);
			wireframe_line.material.depthTest = false;
			wireframe_line.material.opacity = 0.25;
			wireframe_line.material.transparent = true;
			wireframe_line.position.x = child_mesh.position.x;
			wireframe_line.position.y = child_mesh.position.y;
			wireframe_line.position.z = child_mesh.position.z;
			scene.add(wireframe_line);
		}*/
		
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
	// generate a tree structure
	var root_node = new Node(files[0]["webkitRelativePath"].split("/")[0], undefined, [], NodeType.Directory, undefined);
	for (const file of files) {
		let dirs = file["webkitRelativePath"].split("/");
		dirs.shift();	// remove the first element (which is a name of the root dir)
		create_node(root_node, dirs, 0, dirs.length);
	}
	console.log(root_node);
	
	//initialise graphics
	const CAMERA_FOV = 75;
	const CAMERA_ASPECT_RATIO = window.innerWidth / window.innerHeight;
	const CAMERA_NEAR = 0.1;
	const CAMERA_FAR = 1000;
	
	const CAMERA_INITIAL_POSITION = new THREE.Vector3(0, 50, 50);
	
	const camera = new THREE.PerspectiveCamera(CAMERA_FOV, CAMERA_ASPECT_RATIO, CAMERA_NEAR, CAMERA_FAR);
	
	camera.position.set(CAMERA_INITIAL_POSITION.x, CAMERA_INITIAL_POSITION.y, CAMERA_INITIAL_POSITION.z);
	
	const scene = new THREE.Scene();
	
	const renderer = new THREE.WebGLRenderer({antialias : true});
	renderer.setSize(window.innerWidth, window.innerHeight);
	renderer.setClearColor(0x4B5A20, 1.0);
	document.body.appendChild(renderer.domElement);
	
	const controls = new THREE.FirstPersonControls(camera, renderer.domElement);
	controls.lookSpeed = 0.1;
	controls.movementSpeed = 20;
	
	let clock = new THREE.Clock();
	
	interactive_update = true;
	var current_node = root_node;
	
	var camera_is_being_pulled = false;
	var camera_pull_point = new THREE.Vector3();
	camera_pull_point.set(0, 0, 0);
	
	const mmi = new MouseMeshInteraction(scene, camera);
	
	mmi.addHandler('directory', 'click', function(mesh) {
		camera_pull_point.set(mesh.position.x, mesh.position.y, mesh.position.z);
		camera_is_being_pulled = true;
		
		if (current_node.mesh === mesh && current_node !== root_node) {
			current_node = current_node.root;
		}
		else {
			for (let i = 0; i < current_node.children.length; i++) {
				if (current_node.children[i].mesh === mesh) {
					current_node = current_node.children[i];
					break;
				}
			}
		}
	});
	
	function update_and_render() {
		requestAnimationFrame(update_and_render);
		
		let delta = clock.getDelta();
		controls.update(delta);
		
		mmi.update();
		
		// slowly pull camera towards the clicked mesh
		if (camera_is_being_pulled) {
			let dx = (camera.position.x - camera_pull_point.x) / 10;
			let dy = (camera.position.y - camera_pull_point.y) / 10;
			let dz = (camera.position.z - camera_pull_point.z) / 10;
			
			camera.position.set(camera.position.x - dx, camera.position.y - dy, camera.position.z - dz);
			
			// when camera gets close enough, stop pulling
			if (Math.abs(dx) < NODE_SIZE * 0.1 && Math.abs(dy) < NODE_SIZE * 0.1 && Math.abs(dz) < NODE_SIZE * 0.1) {
				camera_is_being_pulled = false;
				interactive_update = true;
				camera.position.set(CAMERA_INITIAL_POSITION.x, CAMERA_INITIAL_POSITION.y, CAMERA_INITIAL_POSITION.z);
			}
		}
		
		if (interactive_update)
		{
			clear_three_object(scene);
			make_interactive_geometry(scene, current_node);
			interactive_update = false;
		}
		
		renderer.render(scene, camera);
	}
	
	update_and_render();
}

init();