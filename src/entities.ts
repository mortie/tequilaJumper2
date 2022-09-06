import Game, {Entity, EntityProps, Box} from './Game';

export class Platform implements Entity {
	props = new EntityProps({
		platform: true,
	});

	box: Box;
	color: string;
	constructor(x: number, y: number, w: number, h: number, color = "#ddd") {
		this.box = new Box(x, y, w, h);
		this.color = color;
	}

	update(_game: Game, _dt: number) {
	}

	draw(ctx: CanvasRenderingContext2D) {
		ctx.fillStyle = this.color;
		ctx.strokeStyle = "black";
		ctx.fillRect(this.box.x, this.box.y, this.box.width, this.box.height);
		ctx.strokeRect(this.box.x, this.box.y, this.box.width, this.box.height);
	}
}

export class Wall implements Entity {
	props = new EntityProps({
		wall: true,
	});

	box: Box;
	constructor(x: number, y: number, w: number, h: number) {
		this.box = new Box(x, y, w, h);
	}

	update(_game: Game, _dt: number) {
	}

	draw(ctx: CanvasRenderingContext2D) {
		ctx.fillStyle = "#444";
		ctx.strokeStyle = "black";
		ctx.fillRect(this.box.x, this.box.y, this.box.width, this.box.height);
		ctx.strokeRect(this.box.x, this.box.y, this.box.width, this.box.height);
	}
}
