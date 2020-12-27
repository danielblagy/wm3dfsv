const NodeType = {
	Directory : 1,
	File : 2
};
Object.freeze(NodeType);

class Node {
	constructor(root, children, type) {
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

function start(files) {
	// separate root dir name from the files in array
	// for each file in array determine its position in the file system tree and create a node object
	
	const scene = new THREE.Scene();
	const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
	
	const renderer = new THREE.WebGLRenderer();
	renderer.setSize(window.innerWidth, window.innerHeight);
	document.body.appendChild(renderer.domElement);
	
	const geometry = new THREE.BoxGeometry();
	const material = new THREE.MeshBasicMaterial( { color: 0x15384a } );
	const cube = new THREE.Mesh(geometry, material);
	scene.add(cube);
			
	camera.position.z = 5;
	
	function update_and_render() {
		requestAnimationFrame(update_and_render);
		cube.rotation.x += 0.01;
		cube.rotation.y += 0.035;
		cube.rotation.z -= 0.015;
		renderer.render(scene, camera);
	}
	
	update_and_render();
}

init();