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

function count_dir_children(children) {
	let i = 0;
	for (const child of children) {
		if (child.type === NodeType.Directory)
			i++;
	}
	return i;
}

function count_file_children(children) {
	let i = 0;
	for (const child of children) {
		if (child.type === NodeType.File)
			i++;
	}
	return i;
}

function make_geometry(scene, node, x, y, z) {
	if (node.name === "objects")
		console.log(node, '  ', x, ':', y, ':', z);
	const node_mesh = make_node_mesh(scene, node, NODE_SIZE, x, y, z);
	
	let dir_children_amount = count_dir_children(node.children);
	let file_children_amount = count_file_children(node.children);
	
	// for file nodes
	const y_gap = NODE_SIZE;
	
	// for dir nodes
	let radius = NODE_SIZE * 10;
	radius -= dir_children_amount * NODE_SIZE * 0.001;
	let angle_between_children = Math.PI * 2 / dir_children_amount;
	
	let dir_count = 0;
	let file_count = 1;
	
	let next_dir_child_y = y + y_gap * file_children_amount + NODE_SIZE * 5;
	
	for (const child of node.children) {
		if (child.type == NodeType.Directory) {
			let angle = angle_between_children * dir_count;// - Math.PI / 2;
			let distance_to_next_child_position = 2 * radius * Math.sin(angle / 2);
			let angle_for_next_calculation = Math.PI / 2 - (Math.PI - angle) / 2;
				
			let next_dir_child_x = x + Math.cos(angle_for_next_calculation) * distance_to_next_child_position;
			let next_dir_child_z = z - Math.sin(angle_for_next_calculation) * distance_to_next_child_position;
			
			if (child.name === "lib" || child.name === ".git")
				console.log(
					child.name, '\n',
					angle_between_children, '\n',
					angle, '\n',
					distance_to_next_child_position, '\n',
					angle_for_next_calculation, '\n',
					next_dir_child_x, '\n',
					next_dir_child_z, '\n'
				);
			
			// create line connecting the node mesh and the child node mesh
			const line_points = [];
			line_points.push(node_mesh.position);
			line_points.push(new THREE.Vector3(next_dir_child_x, next_dir_child_y, next_dir_child_z));
			const line_geometry = new THREE.BufferGeometry().setFromPoints(line_points);
			let line = new THREE.Line(line_geometry, LINE_MATERIAL);
			scene.add(line);
			
			make_geometry(scene, child, next_dir_child_x, next_dir_child_y, next_dir_child_z);
			dir_count++;
		}
		else if (child.type === NodeType.File) {
			let next_file_node_y = y + y_gap * file_count;
			make_geometry(scene, child, x, next_file_node_y, z);
			file_count++;
		}
	}
}

function make_interactive_geometry(scene, node, pointer) {
	make_node_mesh(scene, node, NODE_SIZE, 0, 0, 0);
	
	let i = 0;
	const x_gap = NODE_SIZE * 5;
	const start_x = -1 * x_gap * (node.children.length - 1) / 2;
	for (const child of node.children) {
		let x = start_x + x_gap * i;
		let child_mesh = make_node_mesh(scene, child, NODE_SIZE, x, 0, -5 * NODE_SIZE);
		
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
	// generate a tree structure
	var root_node = new Node(files[0]["webkitRelativePath"].split("/")[0], undefined, [], NodeType.Directory);
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
	
	const overview_scene = new THREE.Scene();
	const interactive_scene = new THREE.Scene();
	
	const renderer = new THREE.WebGLRenderer({antialias : true});
	renderer.setSize(window.innerWidth, window.innerHeight);
	renderer.setClearColor(0x4B5A20, 1.0);
	document.body.appendChild(renderer.domElement);
	
	//const controls = new THREE.OrbitControls(camera, renderer.domElement);
	const controls = new THREE.FirstPersonControls(camera, renderer.domElement);
	controls.lookSpeed = 0.1;
	controls.movementSpeed = 20;
	
	let clock = new THREE.Clock();
	
	// for camera pull feature
	const raycaster = new THREE.Raycaster();
	var mouse = new THREE.Vector2();
	
	var camera_pull_point = new THREE.Vector3();
	camera_pull_point.set(0, 0, 0);
	
	var camera_is_being_pulled = false;
	var camera_pull_activated = false;
	
	var interactive_mode_enabled = false;
	var interactive_current_node = root_node;
	var interactive_pointer = 0;
	var interactive_updated = false;
	
	make_geometry(overview_scene, root_node, 0, 0, 0);
	
	// keyboard input handling
	document.addEventListener('keyup', function(event) {
		interactive_updated = true;
		// f
		if(event.keyCode == 70) {
			interactive_mode_enabled = !interactive_mode_enabled;
		}
		
		// s
		else if(event.keyCode == 83) {
			if (interactive_mode_enabled) {
				if (interactive_current_node !== root_node) {
					interactive_current_node = interactive_current_node.root;
				}
			}
		}
		// w
		else if(event.keyCode == 87) {
			if (interactive_mode_enabled) {
				if (interactive_pointer < interactive_current_node.children.length) {
					interactive_current_node = interactive_current_node.children[interactive_pointer];
					interactive_pointer = 0;
				}
			}
		}
		// d
		else if(event.keyCode == 68) {
			if (interactive_mode_enabled) {
				if (interactive_pointer + 1 < interactive_current_node.children.length) {
					interactive_pointer++;
				}
				else {
					interactive_pointer = 0;
				}
			}
		}
		// a
		else if(event.keyCode == 65) {
			if (interactive_mode_enabled) {
				if (interactive_pointer === 0) {
					if (interactive_current_node.children.length)
					interactive_pointer = interactive_current_node.children.length - 1;
				}
				else {
					interactive_pointer--;
				}
			}
		}
	});
	
	window.addEventListener('mousemove', function(event) {
		// calculate mouse position in normalized device coordinates
		// (-1 to +1) for both components
		mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
		mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
	}, false);
	
	window.addEventListener('click', function(event) {
		camera_pull_activated = true;
	});
	
	function update_and_render() {
		requestAnimationFrame(update_and_render);
		
		let delta = clock.getDelta();
		controls.update(delta);
		
		if (camera_pull_activated) {
			// update the picking ray with the camera and mouse position
			raycaster.setFromCamera(mouse, camera);
			
			// calculate objects intersecting the picking ray
			const intersects = raycaster.intersectObjects(overview_scene.children);
			
			if (intersects.length > 0) {
				let position = intersects[0].object.position;
				camera_pull_point.set(position.x, position.y, position.z);
				camera_is_being_pulled = true;
			}
			
			camera_pull_activated = false;
		}
		
		if (camera_is_being_pulled) {
			let dx = (camera.position.x - camera_pull_point.x) / 5;
			let dy = (camera.position.y - camera_pull_point.y) / 5;
			let dz = (camera.position.z - camera_pull_point.z) / 5;
			camera.position.set(camera.position.x - dx, camera.position.y - dy, camera.position.z - dz);
			
			if (Math.abs(dx) < NODE_SIZE * 2 && Math.abs(dy) < NODE_SIZE * 2 && Math.abs(dz) < NODE_SIZE * 2)
				camera_is_being_pulled = false;
		}
		
		if (interactive_updated)
		{
			clear_three_object(interactive_scene);
			make_interactive_geometry(interactive_scene, interactive_current_node, interactive_pointer);
			interactive_updated = false;
		}
		
		if (interactive_mode_enabled)
			renderer.render(interactive_scene, camera);
		else
			renderer.render(overview_scene, camera);
	}
	
	update_and_render();
}

init();