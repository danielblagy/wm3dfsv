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
		// if name includes '.', then we'll consider it a file, otherwise it's a directory
		if (dirs[count].includes("."))
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
	const geometry = new THREE.BoxGeometry(5, 5, 5);
	const material = new THREE.MeshBasicMaterial( { color: 0x15384a } );
	//const material = new THREE.MeshBasicMaterial( { color: () } );
	const cube = new THREE.Mesh(geometry, material);
	cube.position.x = x;
	cube.position.z = z;
	scene.add(cube);
	
	let label = new THREE.TextSprite({
		text: node.name,
		fontFamily: 'Arial, Helvetica, sans-serif',
		fontSize: 4,
		color: '#ffbbff',
	  });
	cube.add(label);
	
	let i = 0;
	let sign = 1;
	for (const child of node.children) {
		make_geometry(scene, child, sign * 10 * i, z - 10);
		i++;
		sign *= -1;
	}
}

function start(files) {
	// separate root dir name from the files in array
	// for each file in array determine its position in the file system tree and create a node object
	
	var root_node = new Node(files[0]["webkitRelativePath"].split("/")[0], undefined, [], NodeType.Directory);
	
	// brute force algorithm
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
	
	//const geometry = new THREE.BoxGeometry();
	//const material = new THREE.MeshBasicMaterial( { color: 0x15384a } );
	//
	//const cube1 = new THREE.Mesh(geometry, material);
	//cube1.position.set(10, 0, 0);
	//
	//const cube2 = new THREE.Mesh(geometry, material);
	//cube2.position.set(-10, 0, 0);
	//
	//const group = new THREE.Group();
	//group.add(cube1);
	//group.add(cube2);
	//
	//scene.add(group);
	
	let sprite = new THREE.TextSprite({
		text: 'Hello World!',
		fontFamily: 'Arial, Helvetica, sans-serif',
		fontSize: 12,
		color: '#ffbbff',
	  });
	scene.add(sprite);
	
	const controls = new THREE.OrbitControls(camera, renderer.domElement);
	// controls.update() must be called after any manual changes to the camera's transform
	//controls.update();
	
	make_geometry(scene, root_node, 0, 0);
			
	camera.position.z = 50;
	
	function update_and_render() {
		requestAnimationFrame(update_and_render);
		
		//group.rotation.x += 0.01;
		//group.rotation.y += 0.035;
		//group.rotation.z -= 0.015;
		//group.position.z += 0.01;
		
		// required if controls.enableDamping or controls.autoRotate are set to true
		controls.update();
		
		renderer.render(scene, camera);
	}
	
	update_and_render();
}

init();