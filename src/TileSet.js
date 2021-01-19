export default class TileSet {
  constructor(dim) {
    this.currentTileIdx = 1;
    this.dim = dim;
    this.tiles = [new ImageData(dim, dim), new ImageData(dim, dim)];
    for (let i = 0; i < this.tiles[0].data.length / 4; i++) {
      this.tiles[0].data[4 * i + 3] = 255;
      this.tiles[1].data[4 * i + 3] = 255;
    }
  }
  addTile(imgData) {
    this.tiles.push(imgData);
  }
  getCurrentTile() {
    return this.tiles[this.currentTileIdx];
  }
  updateCurrentTile(imgData) {
    this.tiles[this.currentTileIdx] = imgData;
  }
  set(otherTileSet) {
    this.tiles = [];
    this.currentTileIdx = otherTileSet.currentTileIdx;
    for (let i = 0; i < otherTileSet.tiles.length; i++) {
      this.tiles.push(new ImageData(this.dim, this.dim));
      for (let j = 0; j < otherTileSet.tiles[i].data.length; j++) {
        this.tiles[i].data[j] = otherTileSet.tiles[i].data[j];
      }
    }
  }
}