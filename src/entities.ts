import Game, {Entity, EntityProps, Box} from './Game';

export class Platform implements Entity {
	props = new EntityProps({
		platform: true,
	});

	box: Box;
	color: string;

	constructor(box: Box, color = "#ddd") {
		this.box = box;
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
