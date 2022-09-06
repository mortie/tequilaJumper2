import {GameController} from './gamecontrollers';
import Canvas from './Canvas';
import Player from './Player';

export interface Point {
	x: number, y: number,
}

export class Box {
	x: number;
	y: number;
	width: number;
	height: number;

	constructor(x: number, y: number, width: number, height: number) {
		this.x = x;
		this.y = y;
		this.width = width;
		this.height = height;
	}

	intersects(other: Box) {
		return (
			this.x + this.width > other.x && this.x < other.x + other.width &&
			this.y + this.height > other.y && this.y < other.y + other.height);
	}

	bottomIntersects(other: Box) {
		return (
			this.x + this.width > other.x && this.x < other.x + other.width &&
			this.y + this.height > other.y && this.y + this.height < other.y + other.height);
	}
}

export class EntityProps {
	wall = false;
	platform = false;

	public constructor(init?: Partial<EntityProps>) {
		Object.assign(this, init);
	}
}

export interface Entity {
	box: Box;
	props: EntityProps;

	update(game: Game, dt: number): void;
	draw(ctx: CanvasRenderingContext2D): void;
}

export interface WorldGen {
	tick(game: Game, camera: Point): void;
}

export default class Game {
	players: Player[] = [];
	paused = false;
	camera: Point = {x: 0, y: 0};
	gameOver = false;
	winner: Player|null = null;
	entities: Entity[] = [];
	worldgen: WorldGen;

	constructor(wg: WorldGen) {
		this.worldgen = wg;
		this.worldgen.tick(this, this.camera);
	}

	update(can: Canvas, dt: number) {
		if (dt > 0.05) {
			console.warn("Delta time too big (" + dt + "s), campping to 100ms");
			dt = 0.05;
		}

		let ctx = can.ctx;
		ctx.translate(can.width / 2, can.height / 1.5);
		ctx.scale(30, 30);

		let liveCount = 0;
		let camCenter = {x: 0, y: 0};
		for (let player of this.players) {
			if (player.lost) continue;
			camCenter.x += player.box.x + player.box.width / 2;
			camCenter.y += player.box.y + player.box.height / 2;
			liveCount += 1;
		}

		if (liveCount > 0) {
			camCenter.x /= liveCount;
			camCenter.y /= liveCount;

			let camDeltaX = camCenter.x - this.camera.x;
			this.camera.x += camDeltaX * 10 * dt;
			let camDeltaY = camCenter.y - this.camera.y;
			this.camera.y += camDeltaY * 10 * dt;

		}

		this.worldgen.tick(this, this.camera);
		ctx.translate(-this.camera.x, -this.camera.y);

		for (let entity of this.entities) {
			entity.update(this, dt);
		}

		let actualLivePlayer = null;
		let maybeLivePlayer = null;
		liveCount = 0;
		for (let player of this.players) {
			if (player.lost) continue;
			maybeLivePlayer = player;
			player.update(dt);
			if (player.box.y > this.camera.y + 15) {
				player.lost = true;
			} else {
				actualLivePlayer = player;
				liveCount += 1;
			}
		}

		if (liveCount <= 1 && this.players.length > 1) {
			if (liveCount == 0) {
				this.winner = maybeLivePlayer;
			} else {
				this.winner = actualLivePlayer;
			}
			return;
		} else if (liveCount == 0) {
			this.gameOver = true;
		}

		for (let player of this.players) {
			player.draw(ctx);
		}

		ctx.save();
		let prevCtor = null;
		for (let entity of this.entities) {
			if (prevCtor != entity.constructor) {
				if (prevCtor) {
					ctx.restore();
					ctx.save();
				}
				prevCtor = entity.constructor;
			}

			entity.draw(ctx);
		}
		ctx.restore();
	}

	addPlayer(controller: GameController, color: string) {
		let x = (Math.random() * 2 - 1) * 5;
		let player = new Player(this, controller, color, x, 0);
		this.players.push(player);
	}

	spawn(entity: Entity) {
		this.entities.push(entity);
	}
}
