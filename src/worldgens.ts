import Game, {WorldGen, Point, Box} from './Game';
import {Platform, Wall} from './entities';

export class StupidWorldGen implements WorldGen {
	x = 0;
	y = 0;

	tick(game: Game, camera: Point) {
		if (this.y == 0) {
			game.spawn(new Platform(-100, 2, 200, 1, "#b64b00"));
			game.spawn(new Wall(5, -3, 1, 6));
		}

		while (this.y > camera.y - 20) {
			let x = this.x + (Math.random() * 8 - 4);
			let y = this.y - (Math.random() * 3 + 1);
			let width = Math.random() * 5 + 5;
			game.spawn(new Platform(x - width / 2, y, width, 0.5));
			this.x = x;
			this.y = y;
		}
	}
}

