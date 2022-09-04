import {
	KeyboardController,
	GameController,
	standardKeyMap,
	gamepadControllers,
} from './gamecontrollers';

import Game from './Game';
import Canvas from './Canvas';

interface JoinedPlayer {
	controller: GameController;
	ready: boolean;
	color: string;
}

let colors = [
	"#887700", "#128a00", "#008398", "#b81fff", "#ec004e",
];

function randomColor(players: JoinedPlayer[]) {
	let color = colors[0];

	let index = Math.floor(Math.random() * colors.length);
	for (let i = 0; i < 5; ++i) {
		color = colors[Math.floor(Math.random() * colors.length)];
		let collission = false;
		for (let player of players) {
			if (player.color == color) {
				collission = true;
				break;
			}
		}

		if (collission) {
			index = (index + 1) % colors.length;
		} else {
			return color;
		}
	}

	return color;
}

export default class Lobby {
	game: Game|null = null;
	gamePausedDueToDisconnect = false;

	keyboardControllers: KeyboardController[] = [
		new KeyboardController("Keyboard 1", standardKeyMap),
		new KeyboardController("Keyboard 2", {
			left: "ArrowLeft",
			right: "ArrowRight",
			jump: "ArrowUp",
			cancel: "ArrowDown",
		}),
	];

	joinedPlayers: JoinedPlayer[] = [];

	updateLobbyController(controller: GameController) {
		let reading = controller.read();
		let index = this.joinedPlayers.findIndex(p => p.controller == controller);
		let joinedPlayer = index >= 0 ? this.joinedPlayers[index] : null;

		if (joinedPlayer && reading.cancel) {
			if (joinedPlayer.ready) {
				joinedPlayer.ready = false;
			} else {
				this.joinedPlayers.splice(index, 1);
			}
		} else if (!joinedPlayer && reading.jump) {
			let color = randomColor(this.joinedPlayers)
			this.joinedPlayers.push({controller, ready: false, color});
		} else if (joinedPlayer && !joinedPlayer.ready && reading.jump) {
			joinedPlayer.ready = true;
		}
	}

	updateLobby(ctx: CanvasRenderingContext2D) {
		for (let controller of this.keyboardControllers) {
			this.updateLobbyController(controller);
		}

		for (let controller of gamepadControllers) {
			this.updateLobbyController(controller);
		}

		let y = 10;
		ctx.font = "20pt Sans-Serif";
		ctx.textBaseline = "top";
		ctx.fillText("Press Jump to join!", 10, y);
		y += 35;

		let startGame = this.joinedPlayers.length > 0;
		ctx.strokeStyle = "black";
		ctx.lineWidth = 3;
		for (let player of this.joinedPlayers) {
			if (!player.controller.connected()) {
				this.joinedPlayers.splice(this.joinedPlayers.indexOf(player), 1);
				continue;
			}

			if (!player.ready) {
				startGame = false;
			}

			ctx.fillStyle = player.color;
			ctx.fillRect(15, y, 800, 55);
			ctx.strokeRect(15, y, 800, 55);

			ctx.fillStyle = "black";
			ctx.font = "20pt Sans-Serif";
			ctx.fillText(player.controller.id, 20, y);

			ctx.font = "12pt Sans-Serif";
			let text = player.ready ? "Ready" : "Not ready";
			ctx.fillText(text, 30, y + 35);

			y += 65;
		}

		if (startGame) {
			this.game = new Game();
			for (let player of this.joinedPlayers) {
				this.game.addPlayer(player.controller, player.color);
			}

			this.gamePausedDueToDisconnect = false;
		}
	}

	updateGamePaused(ctx: CanvasRenderingContext2D) {
		let y = 10;
		ctx.fillStyle = "black";
		ctx.font = "20pt Sans-Serif";
		ctx.textBaseline = "top";
		ctx.fillText("Game paused!", 10, y);
		y += 35;

		ctx.strokeStyle = "black";
		ctx.lineWidth = 3;
		for (let player of this.joinedPlayers) {
			if (!player.controller.connected()) {
				ctx.fillStyle = player.color;
				ctx.fillRect(15, y, 800, 55);
				ctx.strokeRect(15, y, 800, 55);

				ctx.fillStyle = "black";
				ctx.font = "20pt Sans-Serif";
				ctx.fillText(player.controller.id, 20, y);

				ctx.font = "12pt Sans-Serif";
				ctx.fillText("Disconnected", 30, y + 35);
			}
		}
	}

	updateGame(can: Canvas, dt: number) {
		if (!this.game) {
			return;
		}

		let hasConnectedPlayers = false;
		let allPlayersConnected = true;
		for (let player of this.joinedPlayers) {
			if (!player.controller.connected()) {
				allPlayersConnected = false;
				if (!this.game.paused) {
					this.game.paused = true;
					this.gamePausedDueToDisconnect = true;
				}
			} else {
				hasConnectedPlayers = true;
			}
		}

		if (!hasConnectedPlayers) {
			this.game = null;
			return;
		}

		if (this.gamePausedDueToDisconnect && allPlayersConnected) {
			this.gamePausedDueToDisconnect = false;
			this.game.paused = false;
		}

		if (this.game.paused) {
			this.updateGamePaused(can.ctx);
		} else {
			this.game.update(can, dt);
		}
	}

	update(can: Canvas, dt: number) {
		can.ctx.textBaseline = "top";
		can.ctx.fillText((1 / dt).toFixed(1) + " FPS", can.width - 50, 5);
		if (this.game) {
			can.ctx.save();
			this.updateGame(can, dt);
			can.ctx.restore();
		} else {
			can.ctx.save();
			this.updateLobby(can.ctx);
			can.ctx.restore();
		}
	}
}
