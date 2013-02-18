(function() {
  var CELL_SIZE, Jelly, JellyCell, Stage, level, levelPicker, levels, moveToCell, stage;

  levels = [["xxxxxxxxxxxxxx", "x            x", "x            x", "x      r     x", "x      xx    x", "x  g     r b x", "xxbxxxg xxxxxx", "xxxxxxxxxxxxxx"], ["xxxxxxxxxxxxxx", "x            x", "x            x", "x            x", "x     g   g  x", "x   r r   r  x", "xxxxx x x xxxx", "xxxxxxxxxxxxxx"], ["xxxxxxxxxxxxxx", "x            x", "x            x", "x   bg  x g  x", "xxx xxxrxxx  x", "x      b     x", "xxx xxxrxxxxxx", "xxxxxxxxxxxxxx"], ["xxxxxxxxxxxxxx", "x            x", "x       r    x", "x       b    x", "x       x    x", "x b r        x", "x b r      b x", "xxx x      xxx", "xxxxx xxxxxxxx", "xxxxxxxxxxxxxx"], ["xxxxxxxxxxxxxx", "x            x", "x            x", "xrg  gg      x", "xxx xxxx xx  x", "xrg          x", "xxxxx  xx   xx", "xxxxxx xx  xxx", "xxxxxxxxxxxxxx"], ["xxxxxxxxxxxxxx", "xxxxxxx      x", "xxxxxxx g    x", "x       xx   x", "x r   b      x", "x x xxx x g  x", "x         x bx", "x       r xxxx", "x   xxxxxxxxxx", "xxxxxxxxxxxxxx"]];

  CELL_SIZE = 48;

  Array.prototype.unique = function() {
    var key, output, value, _ref, _results;
    output = {};
    for (key = 0, _ref = this.length; 0 <= _ref ? key < _ref : key > _ref; 0 <= _ref ? key++ : key--) {
      output[this[key]] = this[key];
    }
    _results = [];
    for (key in output) {
      value = output[key];
      _results.push(value);
    }
    return _results;
  };

  moveToCell = function(dom, x, y) {
    dom.style.left = x * CELL_SIZE + 'px';
    return dom.style.top = y * CELL_SIZE + 'px';
  };

  Stage = (function() {

    function Stage(dom, map) {
      var event, maybeSwallowEvent, _i, _len, _ref,
        _this = this;
      this.dom = dom;
      this.jellies = [];
      this.loadMap(map);
      this.busy = false;
      maybeSwallowEvent = function(e) {
        e.preventDefault();
        if (_this.busy) return e.stopPropagation();
      };
      _ref = ['contextmenu', 'click'];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        event = _ref[_i];
        this.dom.addEventListener(event, maybeSwallowEvent, true);
      }
      this.checkForMerges();
    }

    Stage.prototype.loadMap = function(map) {
      var cell, color, jelly, row, table, td, tr, x, y;
      table = document.createElement('table');
      this.dom.appendChild(table);
      this.cells = (function() {
        var _ref, _results;
        _results = [];
        for (y = 0, _ref = map.length; 0 <= _ref ? y < _ref : y > _ref; 0 <= _ref ? y++ : y--) {
          row = map[y].split(/(?:)/);
          tr = document.createElement('tr');
          table.appendChild(tr);
          _results.push((function() {
            var _ref2, _results2;
            _results2 = [];
            for (x = 0, _ref2 = row.length; 0 <= _ref2 ? x < _ref2 : x > _ref2; 0 <= _ref2 ? x++ : x--) {
              color = null;
              cell = null;
              switch (row[x]) {
                case 'x':
                  cell = document.createElement('td');
                  cell.className = 'cell wall';
                  tr.appendChild(cell);
                  break;
                case 'r':
                  color = 'red';
                  break;
                case 'g':
                  color = 'green';
                  break;
                case 'b':
                  color = 'blue';
              }
              if (!cell) {
                td = document.createElement('td');
                td.className = 'transparent';
                tr.appendChild(td);
              }
              if (color) {
                jelly = new Jelly(this, x, y, color);
                this.dom.appendChild(jelly.dom);
                this.jellies.push(jelly);
                cell = jelly;
              }
              _results2.push(cell);
            }
            return _results2;
          }).call(this));
        }
        return _results;
      }).call(this);
      this.addBorders();
    };

    Stage.prototype.addBorders = function() {
      var attr, border, cell, dx, dy, edges, other, x, y, _i, _len, _ref, _ref2, _ref3, _ref4, _ref5;
      for (y = 0, _ref = this.cells.length; 0 <= _ref ? y < _ref : y > _ref; 0 <= _ref ? y++ : y--) {
        for (x = 0, _ref2 = this.cells[0].length; 0 <= _ref2 ? x < _ref2 : x > _ref2; 0 <= _ref2 ? x++ : x--) {
          cell = this.cells[y][x];
          if (!(cell && cell.tagName === 'TD')) continue;
          border = 'solid 1px #777';
          edges = [['borderBottom', 0, 1], ['borderTop', 0, -1], ['borderLeft', -1, 0], ['borderRight', 1, 0]];
          for (_i = 0, _len = edges.length; _i < _len; _i++) {
            _ref3 = edges[_i], attr = _ref3[0], dx = _ref3[1], dy = _ref3[2];
            if (!((0 <= (_ref4 = y + dy) && _ref4 < this.cells.length))) continue;
            if (!((0 <= (_ref5 = x + dx) && _ref5 < this.cells[0].length))) {
              continue;
            }
            other = this.cells[y + dy][x + dx];
            if (!(other && other.tagName === 'TD')) cell.style[attr] = border;
          }
        }
      }
    };

    Stage.prototype.canSlide = function(jelly, dir) {
      var obstacle, obstacles, _i, _len;
      obstacles = this.checkFilled(jelly, dir, 0);
      for (_i = 0, _len = obstacles.length; _i < _len; _i++) {
        obstacle = obstacles[_i];
        if (!this.canSlide(obstacle, dir)) return false;
      }
      return true;
    };

    Stage.prototype.slide = function(jelly, dir) {
      var obstacle, obstacles, _i, _len,
        _this = this;
      obstacles = this.checkFilled(jelly, dir, 0);
      for (_i = 0, _len = obstacles.length; _i < _len; _i++) {
        obstacle = obstacles[_i];
        this.slide(obstacle, dir);
      }
      this.busy = true;
      this.move(jelly, jelly.x + dir, jelly.y);
      return jelly.slide(dir, function() {
        _this.checkFall();
        _this.checkForMerges();
        return _this.busy = false;
      });
    };

    Stage.prototype.trySlide = function(jelly, dir) {
      if (!this.canSlide(jelly, dir)) return;
      return this.slide(jelly, dir);
    };

    Stage.prototype.move = function(jelly, targetX, targetY) {
      var x, y, _i, _j, _len, _len2, _ref, _ref2, _ref3, _ref4;
      _ref = jelly.cellCoords();
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        _ref2 = _ref[_i], x = _ref2[0], y = _ref2[1];
        this.cells[y][x] = null;
      }
      jelly.updatePosition(targetX, targetY);
      _ref3 = jelly.cellCoords();
      for (_j = 0, _len2 = _ref3.length; _j < _len2; _j++) {
        _ref4 = _ref3[_j], x = _ref4[0], y = _ref4[1];
        this.cells[y][x] = jelly;
      }
    };

    Stage.prototype.checkFilled = function(jelly, dx, dy) {
      var next, obstacles, x, y, _i, _len, _ref, _ref2;
      obstacles = [];
      _ref = jelly.cellCoords();
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        _ref2 = _ref[_i], x = _ref2[0], y = _ref2[1];
        next = this.cells[y + dy][x + dx];
        if (next && next !== jelly) obstacles.push(next);
      }
      return obstacles.unique();
    };

    Stage.prototype.checkFall = function() {
      var jelly, moved, _i, _len, _ref;
      moved = true;
      while (moved) {
        moved = false;
        _ref = this.jellies;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          jelly = _ref[_i];
          if (this.checkFilled(jelly, 0, 1).length === 0) {
            this.move(jelly, jelly.x, jelly.y + 1);
            moved = true;
          }
        }
      }
    };

    Stage.prototype.checkForMerges = function() {
      var colors, jelly, merged, x, y, _i, _len, _ref, _ref2;
      merged = false;
      while (jelly = this.doOneMerge()) {
        merged = true;
        _ref = jelly.cellCoords();
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          _ref2 = _ref[_i], x = _ref2[0], y = _ref2[1];
          this.cells[y][x] = jelly;
        }
      }
      if (merged) {
        colors = (this.jellies.map(function(jelly) {
          return jelly.color;
        })).unique().length;
        if (colors === this.jellies.length) {
          alert("Congratulations! Level completed.");
        }
      }
    };

    Stage.prototype.doOneMerge = function() {
      var dx, dy, jelly, other, x, y, _i, _j, _k, _len, _len2, _len3, _ref, _ref2, _ref3, _ref4, _ref5;
      _ref = this.jellies;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        jelly = _ref[_i];
        _ref2 = jelly.cellCoords();
        for (_j = 0, _len2 = _ref2.length; _j < _len2; _j++) {
          _ref3 = _ref2[_j], x = _ref3[0], y = _ref3[1];
          _ref4 = [[1, 0], [0, 1]];
          for (_k = 0, _len3 = _ref4.length; _k < _len3; _k++) {
            _ref5 = _ref4[_k], dx = _ref5[0], dy = _ref5[1];
            other = this.cells[y + dy][x + dx];
            if (!(other && other instanceof Jelly)) continue;
            if (other === jelly) continue;
            if (jelly.color !== other.color) continue;
            jelly.merge(other);
            this.jellies = this.jellies.filter(function(j) {
              return j !== other;
            });
            return jelly;
          }
        }
      }
      return null;
    };

    return Stage;

  })();

  JellyCell = (function() {

    function JellyCell(jelly, x, y, color) {
      this.jelly = jelly;
      this.x = x;
      this.y = y;
      this.dom = document.createElement('div');
      this.dom.className = 'cell jelly ' + color;
    }

    return JellyCell;

  })();

  Jelly = (function() {

    function Jelly(stage, x, y, color) {
      var cell,
        _this = this;
      this.x = x;
      this.y = y;
      this.color = color;
      this.dom = document.createElement('div');
      this.updatePosition(this.x, this.y);
      this.dom.className = 'cell jellybox';
      cell = new JellyCell(this, 0, 0, this.color);
      this.dom.appendChild(cell.dom);
      this.cells = [cell];
      this.dom.addEventListener('contextmenu', function(e) {
        return stage.trySlide(_this, 1);
      });
      this.dom.addEventListener('click', function(e) {
        return stage.trySlide(_this, -1);
      });
    }

    Jelly.prototype.cellCoords = function() {
      var cell, _i, _len, _ref, _results;
      _ref = this.cells;
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        cell = _ref[_i];
        _results.push([this.x + cell.x, this.y + cell.y]);
      }
      return _results;
    };

    Jelly.prototype.slide = function(dir, cb) {
      var end,
        _this = this;
      end = function() {
        _this.dom.style.webkitAnimation = '';
        _this.dom.removeEventListener('webkitAnimationEnd', end);
        return cb();
      };
      this.dom.addEventListener('webkitAnimationEnd', end);
      this.dom.style.webkitAnimation = '300ms ease-out';
      if (dir === 1) {
        return this.dom.style.webkitAnimationName = 'slideRight';
      } else {
        return this.dom.style.webkitAnimationName = 'slideLeft';
      }
    };

    Jelly.prototype.updatePosition = function(x, y) {
      this.x = x;
      this.y = y;
      return moveToCell(this.dom, this.x, this.y);
    };

    Jelly.prototype.merge = function(other) {
      var cell, dx, dy, othercell, _i, _j, _k, _len, _len2, _len3, _ref, _ref2, _ref3;
      dx = other.x - this.x;
      dy = other.y - this.y;
      _ref = other.cells;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        cell = _ref[_i];
        this.cells.push(cell);
        cell.x += dx;
        cell.y += dy;
        moveToCell(cell.dom, cell.x, cell.y);
        this.dom.appendChild(cell.dom);
      }
      other.cells = null;
      other.dom.parentNode.removeChild(other.dom);
      _ref2 = this.cells;
      for (_j = 0, _len2 = _ref2.length; _j < _len2; _j++) {
        cell = _ref2[_j];
        _ref3 = this.cells;
        for (_k = 0, _len3 = _ref3.length; _k < _len3; _k++) {
          othercell = _ref3[_k];
          if (othercell === cell) continue;
          if (othercell.x === cell.x + 1 && othercell.y === cell.y) {
            cell.dom.style.borderRight = 'none';
          } else if (othercell.x === cell.x - 1 && othercell.y === cell.y) {
            cell.dom.style.borderLeft = 'none';
          } else if (othercell.x === cell.x && othercell.y === cell.y + 1) {
            cell.dom.style.borderBottom = 'none';
          } else if (othercell.x === cell.x && othercell.y === cell.y - 1) {
            cell.dom.style.borderTop = 'none';
          }
        }
      }
    };

    return Jelly;

  })();

  level = parseInt(location.search.substr(1), 10) || 0;

  stage = new Stage(document.getElementById('map'), levels[level]);

  window.stage = stage;

  levelPicker = document.getElementById('level');

  levelPicker.value = level;

  levelPicker.addEventListener('change', function() {
    return location.search = '?' + levelPicker.value;
  });

  document.getElementById('reset').addEventListener('click', function() {
    stage.dom.innerHTML = '';
    return stage = new Stage(stage.dom, levels[level]);
  });

}).call(this);
