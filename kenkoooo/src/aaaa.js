(this["webpackJsonpICFPC2021-web-simulator"] =
  this["webpackJsonpICFPC2021-web-simulator"] || []).push([
  [1],
  {
    12: function (e, t, n) {
      "use strict";
      function r(e, t) {
        return {
          x: e.x - t.x,
          y: e.y - t.y,
        };
      }
      function c(e, t) {
        return e.x * t.x + e.y * t.y;
      }
      function i(e, t) {
        return e.x * t.y - e.y * t.x;
      }
      function s(e, t, n) {
        return i(r(t, e), r(n, e));
      }
      function a(e, t) {
        for (
          var n = e.map(function (e) {
              return e.x;
            }),
            c = n.reduce(function (e, t) {
              return Math.max(e, t);
            }),
            a = {
              x:
                c +
                2 *
                  (c -
                    n.reduce(function (e, t) {
                      return Math.min(e, t);
                    })) +
                1,
              y: t.y + 1,
            },
            L = 0,
            o = 0;
          o < e.length;
          ++o
        ) {
          var u = (o + 1) % e.length,
            A = e[o],
            j = e[u],
            E = r(A, t),
            b = r(j, t);
          if (0 == i(E, b) && E.x * b.x <= 0 && E.y * b.y <= 0) return !0;
          s(t, a, A) * s(t, a, j) < 0 && s(A, j, t) * s(A, j, a) < 0 && ++L;
        }
        return L % 2 == 1;
      }
      function L(e, t) {
        return c(r(e, t), r(e, t));
      }
      (t.__esModule = !0),
        (t.dislike =
          t.isValidEdge =
          t.d =
          t.isEdgeInside =
          t.isPointInside =
          t.ccw =
          t.cross =
          t.dot =
          t.sub =
            void 0),
        (t.sub = r),
        (t.dot = c),
        (t.cross = i),
        (t.ccw = s),
        (t.isPointInside = a),
        (t.isEdgeInside = function (e, t) {
          if (!a(e, t.src)) return !1;
          if (!a(e, t.dst)) return !1;
          if (
            e.some(function (n, r) {
              var c = e[(r + 1) % e.length];
              return (
                s(t.src, t.dst, n) * s(t.src, t.dst, c) < 0 &&
                s(n, c, t.src) * s(n, c, t.dst) < 0
              );
            })
          )
            return !1;
          var n = {
            x: t.src.x + t.dst.x,
            y: t.src.y + t.dst.y,
          };
          return !!a(
            e.map(function (e) {
              return {
                x: 2 * e.x,
                y: 2 * e.y,
              };
            }),
            n
          );
        }),
        (t.d = L),
        (t.isValidEdge = function (e, t, n) {
          var r = L(e.src, e.dst),
            c = L(t.src, t.dst);
          return 1e6 * Math.abs(c - r) <= n * r;
        }),
        (t.dislike = function (e, t) {
          var n = 0;
          return (
            e.forEach(function (e) {
              n += t.reduce(function (t, n) {
                return Math.min(t, L(e, n));
              }, 1 / 0);
            }),
            n
          );
        });
    },
    65: function (e, t, n) {
      "use strict";
      n.r(t);
      var r = n(0),
        c = n.n(r),
        i = n(24),
        s = n.n(i),
        a = n(72),
        L = n(29),
        o = n(8),
        u = n(31),
        A = n(7),
        j = n(16),
        E = n.n(j),
        b = n(19),
        l = n(10),
        O = n(3),
        d = n(12),
        h = ["GLOBALIST", "BREAK_A_LEG", "WALLHACK", "SUPERFLEX"],
        f = function (e, t) {
          var n;
          return (
            null !==
              (n = null === e || void 0 === e ? void 0 : e.hasOwnProperty(t)) &&
            void 0 !== n &&
            n
          );
        },
        S = function (e) {
          return {
            x: e[0],
            y: e[1],
          };
        },
        B = function (e, t) {
          return e
            .map(function (e, t) {
              var n = Object(O.a)(e, 2);
              return [n[0], n[1], t];
            })
            .filter(function (e) {
              var n = Object(O.a)(e, 3),
                r = n[0],
                c = n[1];
              n[2];
              return !Object(d.isPointInside)(t, {
                x: r,
                y: c,
              });
            })
            .map(function (e) {
              var t = Object(O.a)(e, 3);
              t[0], t[1];
              return t[2];
            });
        },
        v = n(68),
        G = n(69),
        x = n(48),
        _ = n(71),
        R = n(46),
        g = n(73),
        K = n(70),
        I = function (e, t) {
          var n = BigInt(e[0] - t[0]),
            r = BigInt(e[1] - t[1]);
          return n * n + r * r;
        },
        p = function (e) {
          return e > BigInt(0) ? e : -e;
        },
        m = n(45),
        F = [
          [1, -1],
          [1, 1],
        ],
        C = function (e) {
          var t = Object(O.a)(e, 2);
          return {
            x: t[0],
            y: t[1],
          };
        },
        T = n(1),
        y = function (e) {
          var t = e.problem.figure.vertices,
            n = e.problem.figure.edges,
            r = n.map(function (n) {
              var r = Object(O.a)(n, 2),
                c = r[0],
                i = r[1],
                s = S(t[c]),
                a = S(t[i]),
                L = Object(d.d)(s, a),
                o = S(e.userFigure.vertices[c]),
                u = S(e.userFigure.vertices[i]),
                A = Object(d.d)(o, u),
                j = (1e6 * Math.abs(A - L)) / L;
              return A > L ? j : -j;
            }),
            c = Math.max.apply(
              Math,
              Object(l.a)(
                r.map(function (e) {
                  return Math.abs(e);
                })
              )
            );
          return Object(T.jsx)(T.Fragment, {
            children: n.map(function (t, n) {
              var i = Object(O.a)(t, 2),
                s = i[0],
                a = i[1],
                L = e.userFigure.vertices[s],
                o = e.userFigure.vertices[a],
                u = r[n],
                A = (function (e, t, n) {
                  var r = t * Math.min(n, 1 - n),
                    c = function (t) {
                      var c = (t + e / 30) % 12,
                        i = n - r * Math.max(Math.min(c - 3, 9 - c, 1), -1);
                      return Math.round(255 * i)
                        .toString(16)
                        .padStart(2, "0");
                    };
                  return "#".concat(c(0)).concat(c(8)).concat(c(4));
                })(360 + -120 * (0 === c ? 1 : (u + c) / 2 / c), 1, 0.5),
                j = "".concat(s, "-").concat(a);
              return Object(T.jsx)(
                "line",
                {
                  x1: L[0],
                  y1: L[1],
                  x2: o[0],
                  y2: o[1],
                  stroke: A,
                  strokeWidth: "0.3",
                },
                j
              );
            }),
          });
        };
      var P = function (e) {
          var t = e.x,
            n = e.y,
            r = e.pointId,
            c = e.isEditing,
            i = e.isSelected,
            s = e.isBrokenCenter,
            a = e.onClick,
            L = c ? "blue" : i ? "#0FF" : s ? "white" : "black";
          return Object(T.jsx)(
            "circle",
            {
              cx: t,
              cy: n,
              r: "0.7",
              fill: L,
              onClick: function (e) {
                e.shiftKey && a();
              },
              onMouseDown: e.onMouseDown,
              style: {
                cursor: "pointer",
              },
            },
            r
          );
        },
        U = function (e) {
          var t = BigInt(e.problem.epsilon),
            n = e.problem.figure.vertices,
            r = function (t) {
              var n = Object(O.a)(t, 2),
                r = n[0],
                c = n[1];
              return !!e.problem.hole.find(function (e) {
                var t = Object(O.a)(e, 2),
                  n = t[0],
                  i = t[1];
                return n === r && i === c;
              });
            },
            c = e.userFigure.vertices.length > e.problem.figure.vertices.length,
            i = e.problem.figure.vertices.length,
            s = e.userFigure.edges.filter(function (e) {
              var t = Object(O.a)(e, 2),
                n = t[0],
                r = t[1];
              return n === i || r === i;
            }),
            a =
              "WallHack" === e.bonusMode
                ? B(e.userFigure.vertices, e.problem.hole.map(S))
                : [];
          return Object(T.jsxs)(T.Fragment, {
            children: [
              e.problem.hole.map(function (e, t) {
                var n = Object(O.a)(e, 2),
                  r = n[0],
                  c = n[1];
                return Object(T.jsx)(
                  "circle",
                  {
                    cx: r,
                    cy: c,
                    r: "0.7",
                    fill: "#F0F",
                  },
                  t
                );
              }),
              e.problem.bonuses.map(function (e, t) {
                var n = Object(O.a)(e.position, 2),
                  r = n[0],
                  c = n[1],
                  i = (function (e) {
                    switch (e) {
                      case "GLOBALIST":
                        return "yellow";
                      case "BREAK_A_LEG":
                        return "blue";
                      case "WALLHACK":
                        return "orange";
                      default:
                        return "white";
                    }
                  })(e.bonus);
                return Object(T.jsx)(
                  "circle",
                  {
                    cx: r,
                    cy: c,
                    r: "0.7",
                    fill: i,
                  },
                  t
                );
              }),
              "Globalist" === e.bonusMode
                ? Object(T.jsx)(y, {
                    problem: e.problem,
                    userFigure: e.userFigure,
                  })
                : e.problem.figure.edges
                    .filter(function (e) {
                      var t = Object(O.a)(e, 2),
                        n = t[0],
                        r = t[1];
                      return (
                        !c ||
                        !(function (e) {
                          var t = Object(O.a)(e, 2),
                            n = t[0],
                            r = t[1],
                            c = s[0][0] + s[0][1] - i,
                            a = s[1][0] + s[1][1] - i;
                          return (
                            Math.min(n, r) === Math.min(c, a) &&
                            Math.max(n, r) === Math.max(c, a)
                          );
                        })([n, r])
                      );
                    })
                    .map(function (r) {
                      var c = Object(O.a)(r, 2),
                        i = c[0],
                        s = c[1],
                        L = n[i],
                        o = n[s],
                        u = I(L, o),
                        A = e.userFigure.vertices[i],
                        j = e.userFigure.vertices[s],
                        E = I(A, j),
                        b = p(E - u) * BigInt(1e6) <= t * u,
                        l = b ? "green" : u < E ? "red" : "blue",
                        d = b ? "0.3" : "0.5",
                        h =
                          "WallHack" === e.bonusMode &&
                          (a.includes(i) || a.includes(s)),
                        f = "".concat(i, "-").concat(s);
                      return Object(T.jsx)(
                        "line",
                        {
                          strokeDasharray: h ? 2 : void 0,
                          x1: A[0],
                          y1: A[1],
                          x2: j[0],
                          y2: j[1],
                          stroke: l,
                          strokeWidth: d,
                        },
                        f
                      );
                    }),
              s.map(function (r) {
                var c = Object(O.a)(r, 2),
                  a = c[0] + c[1] - i,
                  L = i,
                  o = [s[0][0] + s[0][1] - i, s[1][0] + s[1][1] - i],
                  u = o[0] + o[1] - a,
                  A = n[a],
                  j = n[u],
                  E = I(A, j),
                  b = e.userFigure.vertices[a],
                  l = e.userFigure.vertices[L],
                  d = I(b, l),
                  h = p(BigInt(4) * d - E) * BigInt(1e6) <= t * E,
                  f = h ? "green" : E < BigInt(4) * d ? "red" : "blue",
                  S = h ? "0.3" : "0.5",
                  B = "".concat(a, "-").concat(u);
                return Object(T.jsx)(
                  "line",
                  {
                    x1: b[0],
                    y1: b[1],
                    x2: l[0],
                    y2: l[1],
                    stroke: f,
                    strokeWidth: S,
                  },
                  B
                );
              }),
              e.userFigure.vertices.map(function (e, t) {
                var n = Object(O.a)(e, 2),
                  c = n[0],
                  i = n[1];
                return Object(T.jsx)(
                  "text",
                  {
                    x: c,
                    y: i,
                    fontSize: "3",
                    style: {
                      userSelect: "none",
                    },
                    fill: r([c, i]) ? "green" : "black",
                    children: t,
                  },
                  t
                );
              }),
              e.userFigure.vertices.map(function (t, n) {
                var r,
                  s = Object(O.a)(t, 2),
                  a = s[0],
                  L = s[1];
                return Object(T.jsx)(
                  P,
                  {
                    x: a,
                    y: L,
                    pointId: n,
                    onMouseDown: function () {
                      return e.onEdit(n);
                    },
                    onClick: function () {
                      if (c)
                        alert(
                          "\u4fbf\u5229\u30af\u30ea\u30c3\u30af with BREAK_A_LEG\u306f\u672a\u5b9f\u88c5"
                        );
                      else {
                        var t = (function (e, t, n) {
                          var r = t.hole.map(function (e) {
                              var t = Object(O.a)(e, 2);
                              return {
                                x: t[0],
                                y: t[1],
                              };
                            }),
                            c = t.figure.vertices,
                            i = t.epsilon,
                            s = [];
                          t.figure.edges.forEach(function (e) {
                            var t = Object(O.a)(e, 2),
                              r = t[0],
                              c = t[1];
                            (r !== n && c !== n) || s.push([r, c]);
                          });
                          for (
                            var a = Object(O.a)(e[n], 2),
                              L = a[0],
                              o = a[1],
                              u = 0;
                            u < 100;
                            u++
                          )
                            for (var A = 0, j = [1, -1]; A < j.length; A++) {
                              var E,
                                b = j[A],
                                l = Object(m.a)(F);
                              try {
                                for (l.s(); !(E = l.n()).done; )
                                  for (
                                    var h = Object(O.a)(E.value, 2),
                                      f = h[0],
                                      S = h[1],
                                      B = L - u * b,
                                      v = o,
                                      G = function (t) {
                                        if (
                                          ((B += f * b),
                                          (v += S),
                                          !Object(d.isPointInside)(r, {
                                            x: B,
                                            y: v,
                                          }))
                                        )
                                          return "continue";
                                        var a = {
                                          x: B,
                                          y: v,
                                        };
                                        return s.every(function (t) {
                                          var s = Object(O.a)(t, 2),
                                            L = s[0],
                                            o = s[1],
                                            u = C(c[L]),
                                            A = C(c[o]),
                                            j = {
                                              src: L === n ? a : C(e[L]),
                                              dst: o === n ? a : C(e[o]),
                                            };
                                          return (
                                            Object(d.isValidEdge)(
                                              {
                                                src: u,
                                                dst: A,
                                              },
                                              j,
                                              i
                                            ) && Object(d.isEdgeInside)(r, j)
                                          );
                                        })
                                          ? {
                                              v: a,
                                            }
                                          : void 0;
                                      },
                                      x = 0;
                                    x < u;
                                    x++
                                  ) {
                                    var _ = G();
                                    if (
                                      "continue" !== _ &&
                                      "object" === typeof _
                                    )
                                      return _.v;
                                  }
                              } catch (R) {
                                l.e(R);
                              } finally {
                                l.f();
                              }
                            }
                        })(e.userFigure.vertices, e.problem, n);
                        if (t) {
                          var r = Object(l.a)(e.userFigure.vertices);
                          (r[n] = [t.x, t.y]), e.updateVertices(r);
                        }
                      }
                    },
                    isBrokenCenter: c && i === n,
                    isEditing:
                      (null === (r = e.editorState) || void 0 === r
                        ? void 0
                        : r.pointId) === n,
                    isSelected: e.selectedVertices.includes(n),
                  },
                  n
                );
              }),
            ],
          });
        },
        W = function (e) {
          var t = e.problem,
            n = t.hole
              .map(function (e) {
                var t = Object(O.a)(e, 2),
                  n = t[0],
                  r = t[1];
                return "".concat(n, ",").concat(r);
              })
              .join(" "),
            r = 10,
            c = 0,
            i = 0,
            s = 0,
            a = 0;
          t.hole.forEach(function (e) {
            var t = Object(O.a)(e, 2),
              n = t[0],
              r = t[1];
            (c = Math.min(n, c)),
              (i = Math.min(r, i)),
              (s = Math.max(n, s)),
              (a = Math.max(r, a));
          }),
            t.figure.vertices.forEach(function (e) {
              var t = Object(O.a)(e, 2),
                n = t[0],
                r = t[1];
              (c = Math.min(n, c)),
                (i = Math.min(r, i)),
                (s = Math.max(n, s)),
                (a = Math.max(r, a));
            });
          var L = Math.max(s - c, a - i) + 20;
          return Object(T.jsx)("div", {
            onKeyDown: function (t) {
              t.ctrlKey && t.shiftKey && "KeyZ" === t.code
                ? e.onRedo()
                : t.ctrlKey && "KeyZ" === t.code && e.onUndo();
            },
            tabIndex: 0,
            children: Object(T.jsxs)("svg", {
              style: e.forcedWidth
                ? {
                    width: e.forcedWidth,
                  }
                : {},
              viewBox: ""
                .concat(c - r, " ")
                .concat(i - r, " ")
                .concat(L, " ")
                .concat(L),
              xmlns: "http://www.w3.org/2000/svg",
              onMouseUp: e.onMouseUp,
              onMouseLeave: e.onMouseUp,
              onMouseMove: function (t) {
                var n = t.currentTarget.getBoundingClientRect(),
                  c = t.clientX - n.left,
                  i = t.clientY - n.top,
                  s = Math.round((c * L) / n.width) - r,
                  a = Math.round((i * L) / n.height) - r;
                e.onLatticeTouch([s, a]);
              },
              children: [
                Object(T.jsx)("rect", {
                  x: c - r,
                  y: i - r,
                  width: L,
                  height: L,
                  fill: "#87857e",
                  stroke: "none",
                }),
                Object(T.jsx)("polygon", {
                  points: n,
                  fill: "#e1ddd1",
                  stroke: "none",
                }),
                Object(T.jsx)(U, {
                  problem: t,
                  bonusMode: e.bonusMode,
                  updateVertices: e.updateVertices,
                  userFigure: e.userFigure,
                  editorState: e.editorState,
                  onEdit: e.onEdit,
                  selectedVertices: e.selectedVertices,
                }),
              ],
            }),
          });
        },
        X = n(67),
        k = function (e) {
          var t = (function (e, t) {
            var n = e.epsilon,
              r = e.figure;
            return r.edges.map(function (e) {
              var c = Object(O.a)(e, 2),
                i = c[0],
                s = c[1],
                a = S(r.vertices[i]),
                L = S(r.vertices[s]),
                o = Object(d.d)(a, L),
                u = S(t[i]),
                A = S(t[s]),
                j = Object(d.d)(u, A);
              return {
                cost: (1e6 * Math.abs(o - j)) / n / o / r.edges.length,
                from: i,
                to: s,
              };
            });
          })(e.problem, e.pose);
          t.sort(function (e, t) {
            return t.cost - e.cost;
          });
          var n = 0;
          return (
            t.forEach(function (e) {
              n += e.cost;
            }),
            Object(T.jsxs)(T.Fragment, {
              children: [
                Object(T.jsx)(X.a, {
                  size: "sm",
                  children: Object(T.jsx)("tbody", {
                    children: Object(T.jsxs)("tr", {
                      children: [
                        Object(T.jsx)("th", {
                          children: "GLOBALIST Budget \u4f7f\u7528\u7387",
                        }),
                        Object(T.jsxs)("td", {
                          style:
                            n > 1
                              ? {
                                  color: "red",
                                }
                              : {},
                          children: [(100 * n).toFixed(2), "%"],
                        }),
                      ],
                    }),
                  }),
                }),
                Object(T.jsxs)(X.a, {
                  size: "sm",
                  children: [
                    Object(T.jsx)("thead", {
                      children: Object(T.jsxs)("tr", {
                        children: [
                          Object(T.jsx)("th", {
                            children: "\u8fba",
                          }),
                          Object(T.jsx)("th", {
                            children: "Budget\u4f7f\u7528\u7387",
                          }),
                        ],
                      }),
                    }),
                    Object(T.jsx)("tbody", {
                      children: t
                        .filter(function (e) {
                          return e.cost > 0;
                        })
                        .map(function (e) {
                          var t = "".concat(e.from, "-").concat(e.to);
                          return Object(T.jsxs)(
                            "tr",
                            {
                              children: [
                                Object(T.jsx)("td", {
                                  children: "("
                                    .concat(e.from, ", ")
                                    .concat(e.to, ")"),
                                }),
                                Object(T.jsxs)("td", {
                                  children: [(100 * e.cost).toFixed(2), "%"],
                                }),
                              ],
                            },
                            t
                          );
                        }),
                    }),
                  ],
                }),
              ],
            })
          );
        },
        H = function (e) {
          var t = e.problem,
            n = e.usingGlobalist,
            r = e.isWallHacking,
            c = t.hole.map(function (e) {
              var t = Object(O.a)(e, 2);
              return {
                x: t[0],
                y: t[1],
              };
            }),
            i = e.userFigure.vertices.map(function (e) {
              var t = Object(O.a)(e, 2);
              return {
                x: t[0],
                y: t[1],
              };
            }),
            s = Object(d.dislike)(c, i),
            a = t.figure.vertices,
            L = t.epsilon,
            o = [],
            u = [],
            A = [];
          if (
            (t.figure.edges.forEach(function (t) {
              var n = Object(O.a)(t, 2),
                r = n[0],
                i = n[1],
                s = a[r],
                j = a[i],
                E = I(s, j),
                b = e.userFigure.vertices[r],
                l = e.userFigure.vertices[i],
                h = I(b, l);
              p(h - E) * BigInt(1e6) <= BigInt(L) * E ||
                (E > h ? o.push([r, i]) : u.push([r, i]));
              var f = {
                src: {
                  x: b[0],
                  y: b[1],
                },
                dst: {
                  x: l[0],
                  y: l[1],
                },
              };
              Object(d.isEdgeInside)(c, f) || A.push([r, i]);
            }),
            e.userFigure.vertices.length > t.figure.vertices.length)
          ) {
            var j = t.figure.vertices.length,
              E = e.userFigure.edges.filter(function (e) {
                var t = Object(O.a)(e, 2),
                  n = t[0],
                  r = t[1];
                return n === j || r === j;
              }),
              b = Object(O.a)(E, 2),
              l = b[0],
              h = b[1],
              f = l[0] + l[1] - j,
              S = h[0] + h[1] - j,
              x = function (e) {
                var t = Object(O.a)(e, 2),
                  n = t[0],
                  r = t[1];
                return !(
                  Math.min(n, r) === Math.min(f, S) &&
                  Math.max(n, r) === Math.max(f, S)
                );
              };
            (o = o.filter(x)), (u = u.filter(x)), (A = A.filter(x));
            var _ = a[f],
              R = a[S],
              g = I(_, R),
              K = function (t, n) {
                var r = e.userFigure.vertices[t],
                  i = e.userFigure.vertices[n],
                  s = I(r, i);
                p(BigInt(4) * s - g) * BigInt(1e6) <= BigInt(L) * g ||
                  (g > s * BigInt(4) ? o.push([t, n]) : u.push([t, n]));
                var a = {
                  src: {
                    x: r[0],
                    y: r[1],
                  },
                  dst: {
                    x: i[0],
                    y: i[1],
                  },
                };
                Object(d.isEdgeInside)(c, a) || A.push([t, n]);
              };
            K(f, j), K(S, j);
          }
          if (r) {
            var m = B(e.userFigure.vertices, c),
              F = function (e) {
                var t = Object(O.a)(e, 2),
                  n = t[0],
                  r = t[1];
                return !m.includes(n) && !m.includes(r);
              };
            (o = o.filter(F)), (u = u.filter(F)), (A = A.filter(F));
          }
          return Object(T.jsxs)(v.a, {
            children: [
              Object(T.jsx)(G.a, {
                children: Object(T.jsx)(X.a, {
                  size: "sm",
                  children: Object(T.jsxs)("tbody", {
                    children: [
                      Object(T.jsxs)("tr", {
                        children: [
                          Object(T.jsx)("th", {
                            children: "dislike",
                          }),
                          Object(T.jsx)("td", {
                            children: s,
                          }),
                        ],
                      }),
                      Object(T.jsxs)("tr", {
                        children: [
                          Object(T.jsx)("th", {
                            children: "eps",
                          }),
                          Object(T.jsx)("td", {
                            children: L,
                          }),
                        ],
                      }),
                      r &&
                        Object(T.jsxs)("tr", {
                          children: [
                            Object(T.jsx)("th", {
                              children:
                                "\u67a0\u306e\u5916\u306b\u3042\u308b\u70b9",
                            }),
                            Object(T.jsx)("td", {
                              children: JSON.stringify(
                                B(e.userFigure.vertices, c)
                              ),
                            }),
                          ],
                        }),
                      !n &&
                        Object(T.jsxs)(T.Fragment, {
                          children: [
                            Object(T.jsxs)("tr", {
                              children: [
                                Object(T.jsx)("th", {
                                  children: "\u9577\u3059\u304e\u308b\u8fba",
                                }),
                                Object(T.jsx)("td", {
                                  children: Object(T.jsx)("ul", {
                                    children: u.map(function (e) {
                                      var t = Object(O.a)(e, 2),
                                        n = t[0],
                                        r = t[1];
                                      return Object(T.jsxs)(
                                        "li",
                                        {
                                          children: ["(", n, ", ", r, ")"],
                                        },
                                        "".concat(n, "-").concat(r)
                                      );
                                    }),
                                  }),
                                }),
                              ],
                            }),
                            Object(T.jsxs)("tr", {
                              children: [
                                Object(T.jsx)("th", {
                                  children: "\u77ed\u3059\u304e\u308b\u8fba",
                                }),
                                Object(T.jsx)("td", {
                                  children: Object(T.jsx)("ul", {
                                    children: o.map(function (e) {
                                      var t = Object(O.a)(e, 2),
                                        n = t[0],
                                        r = t[1];
                                      return Object(T.jsxs)(
                                        "li",
                                        {
                                          children: ["(", n, ", ", r, ")"],
                                        },
                                        "".concat(n, "-").concat(r)
                                      );
                                    }),
                                  }),
                                }),
                              ],
                            }),
                          ],
                        }),
                      Object(T.jsxs)("tr", {
                        children: [
                          Object(T.jsx)("th", {
                            children:
                              "\u53ce\u307e\u3063\u3066\u3044\u306a\u3044\u8fba",
                          }),
                          Object(T.jsx)("td", {
                            children: Object(T.jsx)("ul", {
                              children: A.map(function (e) {
                                var t = Object(O.a)(e, 2),
                                  n = t[0],
                                  r = t[1];
                                return Object(T.jsxs)(
                                  "li",
                                  {
                                    children: ["(", n, ", ", r, ")"],
                                  },
                                  "".concat(n, "-").concat(r)
                                );
                              }),
                            }),
                          }),
                        ],
                      }),
                    ],
                  }),
                }),
              }),
              Object(T.jsx)(G.a, {
                children:
                  n &&
                  Object(T.jsx)(k, {
                    problem: t,
                    pose: e.userFigure.vertices,
                  }),
              }),
            ],
          });
        },
        M = (function () {
          var e = Object(b.a)(
            E.a.mark(function e(t, r, c, i) {
              return E.a.wrap(function (e) {
                for (;;)
                  switch ((e.prev = e.next)) {
                    case 0:
                      return (e.next = 2), n.e(0).then(n.bind(null, 77));
                    case 2:
                      e.sent.solve_brute_force(
                        JSON.stringify(t),
                        JSON.stringify(r),
                        JSON.stringify(c),
                        function (e) {
                          console.log("yo");
                          var t = JSON.parse(e);
                          i(t.vertices);
                        }
                      );
                    case 4:
                    case "end":
                      return e.stop();
                  }
              }, e);
            })
          );
          return function (t, n, r, c) {
            return e.apply(this, arguments);
          };
        })(),
        w = function (e) {
          var t =
            e.userFigure.vertices.length > e.problem.figure.vertices.length;
          return Object(T.jsx)(v.a, {
            children: Object(T.jsx)(R.a, {
              disabled: t,
              onClick: Object(b.a)(
                E.a.mark(function t() {
                  return E.a.wrap(function (t) {
                    for (;;)
                      switch ((t.prev = t.next)) {
                        case 0:
                          if (
                            confirm(
                              "SinglePointSolver\u3092\u672c\u5f53\u306b\u5b9f\u884c\u3057\u3066\u3082\u826f\u3044\u3067\u3059\u306d\uff1f"
                            )
                          ) {
                            t.next = 3;
                            break;
                          }
                          return t.abrupt("return");
                        case 3:
                          return (
                            (t.next = 5),
                            M(
                              e.problem,
                              {
                                vertices: e.userFigure.vertices,
                              },
                              e.selectedVertices,
                              e.onSolve
                            )
                          );
                        case 5:
                        case "end":
                          return t.stop();
                      }
                  }, t);
                })
              ),
              children:
                "\u9078\u629e\u3057\u305f\u70b9\u3092\u56fa\u5b9a\u3057\u3066brute-force",
            }),
          });
        },
        N = n(51),
        J =
          "http://icfpc2021-manarimo.s3-website-us-east-1.amazonaws.com/problems",
        V = function (e, t) {
          var n =
            arguments.length > 2 && void 0 !== arguments[2] ? arguments[2] : {};
          return Object(N.a)(
            e,
            t,
            Object(A.a)(
              {
                revalidateOnFocus: !1,
                revalidateOnReconnect: !1,
                refreshWhenHidden: !0,
              },
              n
            )
          );
        },
        D = n(28),
        z = n(42),
        Z = [
          [37, 1, "SUPERFLEX"],
          [79, 1, "GLOBALIST"],
          [97, 1, "WALLHACK"],
          [82, 2, "GLOBALIST"],
          [95, 2, "BREAK_A_LEG"],
          [96, 2, "WALLHACK"],
          [103, 3, "BREAK_A_LEG"],
          [59, 3, "BREAK_A_LEG"],
          [69, 3, "WALLHACK"],
          [34, 4, "BREAK_A_LEG"],
          [57, 4, "GLOBALIST"],
          [64, 4, "WALLHACK"],
          [32, 5, "BREAK_A_LEG"],
          [44, 5, "WALLHACK"],
          [67, 5, "GLOBALIST"],
          [20, 6, "WALLHACK"],
          [8, 6, "BREAK_A_LEG"],
          [90, 6, "WALLHACK"],
          [104, 7, "SUPERFLEX"],
          [55, 7, "GLOBALIST"],
          [92, 7, "GLOBALIST"],
          [16, 8, "BREAK_A_LEG"],
          [31, 8, "WALLHACK"],
          [77, 8, "SUPERFLEX"],
          [122, 9, "WALLHACK"],
          [29, 9, "GLOBALIST"],
          [50, 9, "GLOBALIST"],
          [107, 10, "WALLHACK"],
          [30, 10, "BREAK_A_LEG"],
          [5, 10, "WALLHACK"],
          [48, 11, "BREAK_A_LEG"],
          [56, 11, "SUPERFLEX"],
          [73, 11, "BREAK_A_LEG"],
          [34, 12, "GLOBALIST"],
          [54, 12, "SUPERFLEX"],
          [7, 12, "GLOBALIST"],
          [34, 13, "GLOBALIST"],
          [48, 13, "SUPERFLEX"],
          [80, 13, "GLOBALIST"],
          [35, 14, "WALLHACK"],
          [57, 14, "SUPERFLEX"],
          [9, 14, "BREAK_A_LEG"],
          [37, 15, "BREAK_A_LEG"],
          [58, 15, "WALLHACK"],
          [76, 15, "SUPERFLEX"],
          [25, 16, "WALLHACK"],
          [46, 16, "GLOBALIST"],
          [6, 16, "GLOBALIST"],
          [21, 17, "GLOBALIST"],
          [4, 17, "BREAK_A_LEG"],
          [40, 17, "SUPERFLEX"],
          [23, 18, "BREAK_A_LEG"],
          [63, 18, "GLOBALIST"],
          [89, 18, "GLOBALIST"],
          [115, 19, "GLOBALIST"],
          [26, 19, "BREAK_A_LEG"],
          [55, 19, "GLOBALIST"],
          [11, 20, "GLOBALIST"],
          [13, 20, "GLOBALIST"],
          [61, 20, "BREAK_A_LEG"],
          [121, 21, "GLOBALIST"],
          [51, 21, "SUPERFLEX"],
          [63, 21, "BREAK_A_LEG"],
          [62, 22, "GLOBALIST"],
          [62, 22, "WALLHACK"],
          [99, 22, "GLOBALIST"],
          [131, 23, "BREAK_A_LEG"],
          [27, 23, "BREAK_A_LEG"],
          [91, 23, "SUPERFLEX"],
          [123, 24, "GLOBALIST"],
          [54, 24, "GLOBALIST"],
          [78, 24, "SUPERFLEX"],
          [128, 25, "BREAK_A_LEG"],
          [45, 25, "GLOBALIST"],
          [99, 25, "GLOBALIST"],
          [111, 26, "GLOBALIST"],
          [6, 26, "SUPERFLEX"],
          [87, 26, "GLOBALIST"],
          [47, 27, "SUPERFLEX"],
          [81, 27, "BREAK_A_LEG"],
          [88, 27, "BREAK_A_LEG"],
          [103, 28, "WALLHACK"],
          [46, 28, "BREAK_A_LEG"],
          [69, 28, "WALLHACK"],
          [32, 29, "BREAK_A_LEG"],
          [39, 29, "BREAK_A_LEG"],
          [52, 29, "WALLHACK"],
          [12, 30, "SUPERFLEX"],
          [25, 30, "BREAK_A_LEG"],
          [92, 30, "SUPERFLEX"],
          [11, 31, "BREAK_A_LEG"],
          [46, 31, "WALLHACK"],
          [66, 31, "GLOBALIST"],
          [16, 32, "GLOBALIST"],
          [19, 32, "GLOBALIST"],
          [72, 32, "SUPERFLEX"],
          [102, 33, "WALLHACK"],
          [19, 33, "WALLHACK"],
          [57, 33, "GLOBALIST"],
          [30, 34, "GLOBALIST"],
          [66, 34, "GLOBALIST"],
          [98, 34, "WALLHACK"],
          [1, 35, "GLOBALIST"],
          [75, 35, "SUPERFLEX"],
          [78, 35, "BREAK_A_LEG"],
          [28, 36, "GLOBALIST"],
          [49, 36, "BREAK_A_LEG"],
          [96, 36, "SUPERFLEX"],
          [105, 37, "GLOBALIST"],
          [23, 37, "SUPERFLEX"],
          [39, 37, "GLOBALIST"],
          [1, 38, "BREAK_A_LEG"],
          [53, 38, "GLOBALIST"],
          [63, 38, "WALLHACK"],
          [2, 39, "BREAK_A_LEG"],
          [77, 39, "GLOBALIST"],
          [93, 39, "BREAK_A_LEG"],
          [101, 40, "WALLHACK"],
          [43, 40, "WALLHACK"],
          [72, 40, "GLOBALIST"],
          [15, 41, "GLOBALIST"],
          [60, 41, "GLOBALIST"],
          [73, 41, "GLOBALIST"],
          [119, 42, "GLOBALIST"],
          [65, 42, "BREAK_A_LEG"],
          [67, 42, "SUPERFLEX"],
          [109, 43, "SUPERFLEX"],
          [47, 43, "BREAK_A_LEG"],
          [81, 43, "WALLHACK"],
          [127, 44, "GLOBALIST"],
          [53, 44, "BREAK_A_LEG"],
          [83, 44, "GLOBALIST"],
          [40, 45, "GLOBALIST"],
          [67, 45, "GLOBALIST"],
          [95, 45, "SUPERFLEX"],
          [13, 46, "GLOBALIST"],
          [76, 46, "SUPERFLEX"],
          [84, 46, "BREAK_A_LEG"],
          [27, 47, "SUPERFLEX"],
          [35, 47, "GLOBALIST"],
          [55, 47, "WALLHACK"],
          [42, 48, "WALLHACK"],
          [45, 48, "SUPERFLEX"],
          [85, 48, "BREAK_A_LEG"],
          [11, 49, "GLOBALIST"],
          [20, 49, "GLOBALIST"],
          [65, 49, "WALLHACK"],
          [1, 50, "WALLHACK"],
          [56, 50, "GLOBALIST"],
          [6, 50, "SUPERFLEX"],
          [106, 51, "SUPERFLEX"],
          [75, 51, "BREAK_A_LEG"],
          [86, 51, "BREAK_A_LEG"],
          [125, 52, "WALLHACK"],
          [45, 52, "WALLHACK"],
          [84, 52, "GLOBALIST"],
          [14, 53, "GLOBALIST"],
          [33, 53, "BREAK_A_LEG"],
          [90, 53, "GLOBALIST"],
          [41, 54, "GLOBALIST"],
          [70, 54, "WALLHACK"],
          [91, 54, "SUPERFLEX"],
          [52, 55, "GLOBALIST"],
          [59, 55, "SUPERFLEX"],
          [86, 55, "SUPERFLEX"],
          [124, 56, "WALLHACK"],
          [74, 56, "SUPERFLEX"],
          [78, 56, "BREAK_A_LEG"],
          [117, 57, "GLOBALIST"],
          [14, 57, "BREAK_A_LEG"],
          [85, 57, "SUPERFLEX"],
          [104, 58, "BREAK_A_LEG"],
          [29, 58, "GLOBALIST"],
          [47, 58, "SUPERFLEX"],
          [100, 59, "SUPERFLEX"],
          [3, 59, "WALLHACK"],
          [88, 59, "GLOBALIST"],
          [3, 60, "GLOBALIST"],
          [59, 60, "WALLHACK"],
          [9, 60, "SUPERFLEX"],
          [126, 61, "BREAK_A_LEG"],
          [70, 61, "BREAK_A_LEG"],
          [97, 61, "WALLHACK"],
          [10, 62, "GLOBALIST"],
          [65, 62, "GLOBALIST"],
          [79, 62, "BREAK_A_LEG"],
          [120, 63, "WALLHACK"],
          [4, 63, "BREAK_A_LEG"],
          [83, 63, "SUPERFLEX"],
          [22, 64, "WALLHACK"],
          [76, 64, "BREAK_A_LEG"],
          [9, 64, "GLOBALIST"],
          [18, 65, "GLOBALIST"],
          [28, 65, "GLOBALIST"],
          [54, 65, "BREAK_A_LEG"],
          [102, 66, "WALLHACK"],
          [43, 66, "BREAK_A_LEG"],
          [49, 66, "WALLHACK"],
          [12, 67, "BREAK_A_LEG"],
          [17, 67, "BREAK_A_LEG"],
          [22, 67, "GLOBALIST"],
          [105, 68, "SUPERFLEX"],
          [17, 68, "SUPERFLEX"],
          [58, 68, "GLOBALIST"],
          [12, 69, "WALLHACK"],
          [68, 69, "BREAK_A_LEG"],
          [81, 69, "SUPERFLEX"],
          [130, 70, "BREAK_A_LEG"],
          [50, 70, "GLOBALIST"],
          [69, 70, "GLOBALIST"],
          [19, 71, "SUPERFLEX"],
          [33, 71, "BREAK_A_LEG"],
          [51, 71, "BREAK_A_LEG"],
          [18, 72, "GLOBALIST"],
          [32, 72, "BREAK_A_LEG"],
          [51, 72, "GLOBALIST"],
          [21, 73, "BREAK_A_LEG"],
          [24, 73, "BREAK_A_LEG"],
          [44, 73, "WALLHACK"],
          [16, 74, "BREAK_A_LEG"],
          [22, 74, "GLOBALIST"],
          [62, 74, "SUPERFLEX"],
          [31, 75, "GLOBALIST"],
          [36, 75, "GLOBALIST"],
          [82, 75, "SUPERFLEX"],
          [10, 76, "GLOBALIST"],
          [38, 76, "GLOBALIST"],
          [48, 76, "SUPERFLEX"],
          [112, 77, "GLOBALIST"],
          [26, 77, "SUPERFLEX"],
          [74, 77, "BREAK_A_LEG"],
          [15, 78, "SUPERFLEX"],
          [26, 78, "WALLHACK"],
          [5, 78, "BREAK_A_LEG"],
          [42, 79, "BREAK_A_LEG"],
          [60, 79, "GLOBALIST"],
          [8, 79, "WALLHACK"],
          [24, 80, "WALLHACK"],
          [28, 80, "SUPERFLEX"],
          [60, 80, "GLOBALIST"],
          [2, 81, "BREAK_A_LEG"],
          [3, 81, "GLOBALIST"],
          [75, 81, "BREAK_A_LEG"],
          [25, 82, "GLOBALIST"],
          [36, 82, "BREAK_A_LEG"],
          [41, 82, "SUPERFLEX"],
          [64, 83, "WALLHACK"],
          [77, 83, "GLOBALIST"],
          [79, 83, "WALLHACK"],
          [101, 84, "BREAK_A_LEG"],
          [17, 84, "GLOBALIST"],
          [38, 84, "WALLHACK"],
          [10, 85, "SUPERFLEX"],
          [100, 85, "SUPERFLEX"],
          [64, 85, "GLOBALIST"],
          [114, 86, "BREAK_A_LEG"],
          [73, 86, "BREAK_A_LEG"],
          [93, 86, "GLOBALIST"],
          [2, 87, "GLOBALIST"],
          [71, 87, "BREAK_A_LEG"],
          [85, 87, "GLOBALIST"],
          [13, 88, "BREAK_A_LEG"],
          [43, 88, "BREAK_A_LEG"],
          [44, 88, "BREAK_A_LEG"],
          [105, 89, "SUPERFLEX"],
          [116, 89, "BREAK_A_LEG"],
          [71, 89, "GLOBALIST"],
          [113, 90, "SUPERFLEX"],
          [56, 90, "WALLHACK"],
          [93, 90, "GLOBALIST"],
          [50, 91, "WALLHACK"],
          [94, 91, "WALLHACK"],
          [99, 91, "BREAK_A_LEG"],
          [102, 92, "GLOBALIST"],
          [4, 92, "BREAK_A_LEG"],
          [41, 92, "WALLHACK"],
          [80, 93, "WALLHACK"],
          [91, 93, "GLOBALIST"],
          [98, 93, "WALLHACK"],
          [106, 94, "BREAK_A_LEG"],
          [15, 94, "GLOBALIST"],
          [86, 94, "SUPERFLEX"],
          [7, 95, "BREAK_A_LEG"],
          [89, 95, "SUPERFLEX"],
          [96, 95, "BREAK_A_LEG"],
          [100, 96, "WALLHACK"],
          [132, 96, "WALLHACK"],
          [36, 96, "BREAK_A_LEG"],
          [118, 97, "GLOBALIST"],
          [20, 97, "GLOBALIST"],
          [98, 97, "GLOBALIST"],
          [101, 98, "SUPERFLEX"],
          [129, 98, "WALLHACK"],
          [61, 98, "SUPERFLEX"],
          [68, 99, "SUPERFLEX"],
          [84, 99, "SUPERFLEX"],
          [92, 99, "BREAK_A_LEG"],
          [39, 100, "BREAK_A_LEG"],
          [87, 100, "BREAK_A_LEG"],
          [97, 100, "GLOBALIST"],
          [38, 101, "SUPERFLEX"],
          [83, 101, "SUPERFLEX"],
          [95, 101, "BREAK_A_LEG"],
          [110, 102, "SUPERFLEX"],
          [68, 102, "WALLHACK"],
          [94, 102, "BREAK_A_LEG"],
          [66, 103, "SUPERFLEX"],
          [70, 103, "WALLHACK"],
          [89, 103, "BREAK_A_LEG"],
          [103, 104, "GLOBALIST"],
          [106, 104, "BREAK_A_LEG"],
          [49, 104, "BREAK_A_LEG"],
          [104, 105, "SUPERFLEX"],
          [30, 105, "SUPERFLEX"],
          [8, 105, "BREAK_A_LEG"],
          [58, 106, "BREAK_A_LEG"],
          [87, 106, "SUPERFLEX"],
          [90, 106, "SUPERFLEX"],
          [112, 107, "SUPERFLEX"],
          [124, 107, "GLOBALIST"],
          [27, 107, "WALLHACK"],
          [109, 108, "BREAK_A_LEG"],
          [112, 108, "SUPERFLEX"],
          [82, 108, "BREAK_A_LEG"],
          [121, 109, "GLOBALIST"],
          [131, 109, "SUPERFLEX"],
          [40, 109, "WALLHACK"],
          [108, 110, "BREAK_A_LEG"],
          [129, 110, "SUPERFLEX"],
          [5, 110, "BREAK_A_LEG"],
          [117, 111, "WALLHACK"],
          [119, 111, "BREAK_A_LEG"],
          [21, 111, "BREAK_A_LEG"],
          [113, 112, "GLOBALIST"],
          [127, 112, "BREAK_A_LEG"],
          [80, 112, "SUPERFLEX"],
          [123, 113, "SUPERFLEX"],
          [127, 113, "SUPERFLEX"],
          [52, 113, "SUPERFLEX"],
          [122, 114, "BREAK_A_LEG"],
          [123, 114, "BREAK_A_LEG"],
          [29, 114, "BREAK_A_LEG"],
          [109, 115, "GLOBALIST"],
          [122, 115, "GLOBALIST"],
          [7, 115, "WALLHACK"],
          [114, 116, "WALLHACK"],
          [118, 116, "GLOBALIST"],
          [53, 116, "GLOBALIST"],
          [111, 117, "BREAK_A_LEG"],
          [116, 117, "SUPERFLEX"],
          [72, 117, "SUPERFLEX"],
          [117, 118, "WALLHACK"],
          [119, 118, "WALLHACK"],
          [14, 118, "GLOBALIST"],
          [128, 119, "GLOBALIST"],
          [130, 119, "BREAK_A_LEG"],
          [37, 119, "BREAK_A_LEG"],
          [116, 120, "GLOBALIST"],
          [124, 120, "BREAK_A_LEG"],
          [71, 120, "WALLHACK"],
          [108, 121, "WALLHACK"],
          [120, 121, "SUPERFLEX"],
          [74, 121, "WALLHACK"],
          [115, 122, "BREAK_A_LEG"],
          [126, 122, "WALLHACK"],
          [94, 122, "SUPERFLEX"],
          [113, 123, "SUPERFLEX"],
          [132, 123, "SUPERFLEX"],
          [88, 123, "BREAK_A_LEG"],
          [128, 124, "BREAK_A_LEG"],
          [131, 124, "SUPERFLEX"],
          [23, 124, "BREAK_A_LEG"],
          [107, 125, "SUPERFLEX"],
          [108, 125, "GLOBALIST"],
          [129, 125, "BREAK_A_LEG"],
          [111, 126, "WALLHACK"],
          [125, 126, "GLOBALIST"],
          [35, 126, "WALLHACK"],
          [121, 127, "SUPERFLEX"],
          [130, 127, "GLOBALIST"],
          [42, 127, "SUPERFLEX"],
          [110, 128, "WALLHACK"],
          [114, 128, "GLOBALIST"],
          [24, 128, "GLOBALIST"],
          [126, 129, "SUPERFLEX"],
          [132, 129, "WALLHACK"],
          [18, 129, "GLOBALIST"],
          [107, 130, "BREAK_A_LEG"],
          [125, 130, "GLOBALIST"],
          [31, 130, "SUPERFLEX"],
          [110, 131, "GLOBALIST"],
          [115, 131, "SUPERFLEX"],
          [33, 131, "GLOBALIST"],
          [118, 132, "BREAK_A_LEG"],
          [120, 132, "SUPERFLEX"],
          [61, 132, "GLOBALIST"],
        ],
        Y = function (e, t) {
          var n = Z.find(function (n) {
            var r = Object(O.a)(n, 3),
              c = (r[0], r[1]),
              i = r[2];
            return e === c && i === t;
          });
          return n ? n[0] : -1;
        },
        q = function (e) {
          var t = Object(r.useState)({
              submission: e,
              stack: {
                referenceIndex: 0,
                internalStack: [e],
              },
            }),
            n = Object(O.a)(t, 2),
            c = n[0],
            i = c.stack,
            s = c.submission,
            a = n[1];
          return [
            s,
            function (e) {
              var t = (function (e, t) {
                var n = JSON.parse(JSON.stringify(t)),
                  r = [].concat(
                    Object(l.a)(e.internalStack.slice(0, e.referenceIndex + 1)),
                    [n]
                  );
                return {
                  referenceIndex: r.length - 1,
                  internalStack: r,
                };
              })(i, e);
              a({
                stack: t,
                submission: e,
              });
            },
            function () {
              var e = (function (e) {
                  var t = Math.min(
                    e.internalStack.length - 1,
                    e.referenceIndex + 1
                  );
                  return {
                    stack: Object(A.a)(
                      Object(A.a)({}, e),
                      {},
                      {
                        referenceIndex: t,
                      }
                    ),
                    submission: e.internalStack[t],
                  };
                })(i),
                t = e.stack,
                n = e.submission;
              a({
                stack: t,
                submission: n,
              });
            },
            function () {
              var e = (function (e) {
                  var t = Math.max(e.referenceIndex - 1, 0);
                  return {
                    stack: Object(A.a)(
                      Object(A.a)({}, e),
                      {},
                      {
                        referenceIndex: t,
                      }
                    ),
                    submission: e.internalStack[t],
                  };
                })(i),
                t = e.stack,
                n = e.submission;
              a({
                stack: t,
                submission: n,
              });
            },
          ];
        },
        Q = function (e) {
          var t = e.problem,
            n = (function (e) {
              var t = Z.filter(function (t) {
                var n = Object(O.a)(t, 3),
                  r = (n[0], n[1]);
                return n[2], e === r;
              }).map(function (e) {
                var t = Object(O.a)(e, 3);
                return t[0], t[1], t[2];
              });
              return new Set(t);
            })(e.problemId),
            c = Object(o.f)(),
            i = (function (e) {
              var t = "".concat(J, "/../solutions/").concat(e);
              return V(t, function (t) {
                return e
                  ? fetch(t)
                      .then(function (e) {
                        return e.json();
                      })
                      .then(function (e) {
                        return e;
                      })
                  : Promise.resolve(null);
              });
            })(new URLSearchParams(c.search).get("solution")),
            s = Object(r.useState)("NONE"),
            a = Object(O.a)(s, 2),
            L = a[0],
            u = a[1],
            j = Object(r.useState)("triple"),
            d = Object(O.a)(j, 2),
            S = d[0],
            B = d[1],
            K = Object(r.useState)(null),
            I = Object(O.a)(K, 2),
            p = I[0],
            m = I[1],
            F = q({
              vertices: Object(l.a)(t.figure.vertices),
            }),
            C = Object(O.a)(F, 4),
            y = C[0],
            P = C[1],
            U = C[2],
            X = C[3],
            k = Object(r.useState)(""),
            M = Object(O.a)(k, 2),
            N = M[0],
            Q = M[1],
            $ = Object(r.useState)(null),
            ee = Object(O.a)($, 2),
            te = ee[0],
            ne = ee[1],
            re = Object(r.useState)(1),
            ce = Object(O.a)(re, 2),
            ie = ce[0],
            se = ce[1],
            ae = Object(r.useState)([]),
            Le = Object(O.a)(ae, 2),
            oe = Le[0],
            ue = Le[1],
            Ae = Object(r.useState)(!1),
            je = Object(O.a)(Ae, 2),
            Ee = je[0],
            be = je[1],
            le = Object(r.useState)(0),
            Oe = Object(O.a)(le, 2),
            de = Oe[0],
            he = Oe[1],
            fe = Object(r.useState)(0),
            Se = Object(O.a)(fe, 2),
            Be = Se[0],
            ve = Se[1],
            Ge = Object(r.useState)(!1),
            xe = Object(O.a)(Ge, 2),
            _e = xe[0],
            Re = xe[1],
            ge = Object(r.useState)(2e3),
            Ke = Object(O.a)(ge, 2),
            Ie = Ke[0],
            pe = Ke[1],
            me = Object(r.useState)(!1),
            Fe = Object(O.a)(me, 2),
            Ce = Fe[0],
            Te = Fe[1],
            ye = Object(r.useState)(!1),
            Pe = Object(O.a)(ye, 2),
            Ue = Pe[0],
            We = Pe[1],
            Xe = Object(r.useState)(!1),
            ke = Object(O.a)(Xe, 2),
            He = ke[0],
            Me = ke[1];
          Object(r.useEffect)(
            function () {
              i.data && P(i.data);
            },
            [i]
          ),
            Object(r.useEffect)(
              function () {
                Q(JSON.stringify(y)),
                  y.bonuses &&
                    y.bonuses.length > 0 &&
                    ("BREAK_A_LEG" === y.bonuses[0].bonus
                      ? (be(!0),
                        he(y.bonuses[0].edge[0]),
                        ve(y.bonuses[0].edge[1]))
                      : "WALLHACK" === y.bonuses[0].bonus
                      ? Te(!0)
                      : "GLOBALIST" === y.bonuses[0].bonus
                      ? Me(!0)
                      : "SUPERFLEX" === y.bonuses[0].bonus && We(!0));
              },
              [y]
            );
          var we = (function () {
              var e = Object(b.a)(
                E.a.mark(function e() {
                  return E.a.wrap(function (e) {
                    for (;;)
                      switch ((e.prev = e.next)) {
                        case 0:
                          return (
                            Q(JSON.stringify(y)),
                            (e.next = 3),
                            navigator.clipboard.writeText(JSON.stringify(y))
                          );
                        case 3:
                        case "end":
                          return e.stop();
                      }
                  }, e);
                })
              );
              return function () {
                return e.apply(this, arguments);
              };
            })(),
            Ne = function (e) {
              oe.includes(e)
                ? ue(
                    oe.filter(function (t) {
                      return t !== e;
                    })
                  )
                : ue([].concat(Object(l.a)(oe), [e]));
            },
            Je = function () {
              return oe.length === y.vertices.length;
            },
            Ve = function () {
              Je()
                ? ue([])
                : ue(
                    y.vertices.map(function (e, t) {
                      return t;
                    })
                  );
            },
            De = function (e) {
              var t = "L" === e ? -1 : "R" === e ? 1 : 0,
                n = "D" === e ? 1 : "U" === e ? -1 : 0,
                r = y.vertices.map(function (e, r) {
                  var c = Object(O.a)(e, 2),
                    i = c[0],
                    s = c[1];
                  return oe.includes(r) ? [i + t * ie, s + n * ie] : [i, s];
                });
              P(
                Object(A.a)(
                  Object(A.a)({}, y),
                  {},
                  {
                    vertices: r,
                  }
                )
              );
            },
            ze = function (e, n) {
              return t.figure.edges.find(function (t) {
                var r = Object(O.a)(t, 2),
                  c = r[0],
                  i = r[1];
                return (
                  Math.min(c, i) === Math.min(e, n) &&
                  Math.max(c, i) === Math.max(e, n)
                );
              });
            },
            Ze = function () {
              return !!ze(de, Be);
            },
            Ye = function (t) {
              if (Ee && !t)
                return (
                  P(
                    Object(A.a)(
                      Object(A.a)({}, y),
                      {},
                      {
                        bonuses: [],
                        vertices: y.vertices.slice(0, -1),
                      }
                    )
                  ),
                  void be(!1)
                );
              Ze() &&
                (!(function (t, n) {
                  var r = Object(O.a)(y.vertices[t], 2),
                    c = r[0],
                    i = r[1],
                    s = Object(O.a)(y.vertices[n], 2),
                    a = s[0],
                    L = s[1],
                    o = Math.floor((c + a) / 2),
                    u = Math.floor((i + L) / 2);
                  ze(t, n) &&
                    P(
                      Object(A.a)(
                        Object(A.a)({}, y),
                        {},
                        {
                          bonuses: [
                            {
                              bonus: "BREAK_A_LEG",
                              edge: [t, n],
                              problem: Y(e.problemId, "BREAK_A_LEG"),
                            },
                          ],
                          vertices: [].concat(Object(l.a)(y.vertices), [
                            [o, u],
                          ]),
                        }
                      )
                    );
                })(de, Be),
                be(!0));
            },
            qe = function () {
              P(
                Object(A.a)(
                  Object(A.a)({}, y),
                  {},
                  {
                    bonuses: [],
                  }
                )
              );
            },
            Qe = function (t) {
              P(
                Object(A.a)(
                  Object(A.a)({}, y),
                  {},
                  {
                    bonuses: [
                      {
                        bonus: t,
                        problem: Y(e.problemId, t),
                      },
                    ],
                  }
                )
              );
            },
            $e = (function (e, t) {
              if (
                e.bonuses &&
                e.bonuses.length > 0 &&
                "BREAK_A_LEG" === e.bonuses[0].bonus
              ) {
                var n = t.figure.vertices.length,
                  r = e.bonuses[0].edge,
                  c = t.figure.edges.filter(function (e) {
                    return (
                      Math.min(e[0], e[1]) !== Math.min(r[0], r[1]) ||
                      Math.max(e[0], e[1]) !== Math.max(r[0], r[1])
                    );
                  });
                return (
                  c.push([r[0], n]),
                  c.push([n, r[1]]),
                  {
                    vertices: Object(l.a)(e.vertices),
                    edges: c,
                  }
                );
              }
              return {
                vertices: Object(l.a)(e.vertices),
                edges: Object(l.a)(t.figure.edges),
              };
            })(y, t);
          return Object(T.jsxs)(v.a, {
            children: [
              Object(T.jsxs)(G.a, {
                style: {
                  marginBottom: "8px",
                },
                children: [
                  Object(T.jsx)(x.a, {
                    children: Object(T.jsxs)(z.a, {
                      toggle: !0,
                      children: [
                        Object(T.jsx)(D.a, {
                          type: "checkbox",
                          variant: "secondary",
                          value: "single",
                          checked: "single" === S,
                          onChange: function () {
                            return B("single");
                          },
                          children: "1\u30ab\u30e9\u30e0",
                        }),
                        Object(T.jsx)(D.a, {
                          type: "checkbox",
                          variant: "secondary",
                          value: "triple",
                          checked: "triple" === S,
                          onChange: function () {
                            return B("triple");
                          },
                          children: "3\u30ab\u30e9\u30e0",
                        }),
                      ],
                    }),
                  }),
                  Object(T.jsx)(x.a, {
                    children: Object(T.jsxs)("div", {
                      style: {
                        display: "flex",
                      },
                      children: [
                        Object(T.jsx)("div", {
                          children: Object(T.jsx)(_.a.Check, {
                            type: "checkbox",
                            label: "Zoom",
                            checked: _e,
                            onChange: function () {
                              Re(!_e);
                            },
                          }),
                        }),
                        Object(T.jsx)("div", {
                          children: Object(T.jsx)(_.a.Control, {
                            type: "number",
                            min: 0,
                            value: Ie,
                            onChange: function (e) {
                              return pe(parseInt(e.target.value));
                            },
                          }),
                        }),
                      ],
                    }),
                  }),
                  Object(T.jsx)(x.a, {
                    children: Object(T.jsxs)(z.a, {
                      toggle: !0,
                      children: [
                        Object(T.jsx)(D.a, {
                          type: "checkbox",
                          variant: "secondary",
                          value: "single",
                          checked: "NONE" === L,
                          onChange: function () {
                            return u("NONE");
                          },
                          children: "NONE",
                        }),
                        h.map(function (e) {
                          return Object(T.jsx)(
                            D.a,
                            {
                              type: "checkbox",
                              variant: n.has(e) ? "success" : "secondary",
                              value: "single",
                              checked: L === e,
                              onChange: function () {
                                return u(e);
                              },
                              children: e,
                            },
                            e
                          );
                        }),
                      ],
                    }),
                  }),
                ],
              }),
              Object(T.jsxs)(G.a, {
                children: [
                  Object(T.jsx)(x.a, {
                    sm: "single" === S ? 12 : void 0,
                    children: Object(T.jsx)(W, {
                      userFigure: $e,
                      problem: t,
                      onEdit: function (e) {
                        p ||
                          m({
                            pointId: e,
                          });
                      },
                      onLatticeTouch: function (e) {
                        var t = Object(O.a)(e, 2),
                          n = t[0],
                          r = t[1];
                        if (p) {
                          var c = p.pointId,
                            i = Object(O.a)(y.vertices[c], 2),
                            s = i[0],
                            a = i[1];
                          if (s !== n || a !== r) {
                            var L = Object(l.a)(y.vertices);
                            (L[c] = [n, r]),
                              P(
                                Object(A.a)(
                                  Object(A.a)({}, y),
                                  {},
                                  {
                                    vertices: L,
                                  }
                                )
                              );
                          }
                        }
                      },
                      onMouseUp: function () {
                        p && m(null);
                      },
                      onRedo: U,
                      onUndo: X,
                      editorState: p,
                      selectedVertices: oe,
                      forcedWidth: _e ? Ie : void 0,
                      updateVertices: function (e) {
                        P(
                          Object(A.a)(
                            Object(A.a)({}, y),
                            {},
                            {
                              vertices: e,
                            }
                          )
                        );
                      },
                      bonusMode: Ce
                        ? "WallHack"
                        : "GLOBALIST" === L
                        ? "Globalist"
                        : void 0,
                    }),
                  }),
                  Object(T.jsxs)(x.a, {
                    children: [
                      Object(T.jsxs)(G.a, {
                        children: [
                          Object(T.jsx)(R.a, {
                            onClick: function () {
                              var e = (function (e) {
                                var t = function (e) {
                                    return (
                                      "object" === typeof e &&
                                      Array.isArray(e) &&
                                      2 === e.length &&
                                      "number" === typeof e[0] &&
                                      "number" === typeof e[1]
                                    );
                                  },
                                  n = function (e, t) {
                                    return e.every(function (e) {
                                      return t(e);
                                    });
                                  };
                                try {
                                  var r = JSON.parse(e);
                                  if (
                                    !r ||
                                    "object" !== typeof r ||
                                    !f(r, "vertices") ||
                                    "object" !== typeof r.vertices ||
                                    !Array.isArray(r.vertices) ||
                                    !n(r.vertices, t)
                                  )
                                    return {
                                      result: "failed",
                                      errorMessage:
                                        "`vertices` is not valid format",
                                    };
                                  var c = r.vertices;
                                  return f(r, "bonuses") &&
                                    Array.isArray(r.bonuses)
                                    ? n(r.bonuses, function (e) {
                                        if (
                                          "object" !== typeof e ||
                                          !f(e, "bonus")
                                        )
                                          return !1;
                                        var n = h.find(function (t) {
                                          return t === e.bonus;
                                        });
                                        return (
                                          !!n &&
                                          ("BREAK_A_LEG" !== n ||
                                            (f(e, "edge") && t(e.edge)))
                                        );
                                      })
                                      ? {
                                          result: "success",
                                          submission: {
                                            vertices: c,
                                            bonuses: r.bonuses,
                                          },
                                        }
                                      : {
                                          result: "failed",
                                          errorMessage:
                                            "invalid bonuses format",
                                        }
                                    : {
                                        result: "success",
                                        submission: {
                                          vertices: c,
                                        },
                                      };
                                } catch (i) {
                                  return (
                                    console.error(i),
                                    {
                                      result: "failed",
                                      errorMessage: "JSON parse error",
                                    }
                                  );
                                }
                              })(N);
                              "failed" === e.result
                                ? ne(e.errorMessage)
                                : (P(e.submission), ne(null));
                            },
                            children: "Load",
                          }),
                          Object(T.jsx)(R.a, {
                            onClick: we,
                            className: "ml-3",
                            children: "Copy",
                          }),
                        ],
                      }),
                      te &&
                        Object(T.jsx)(G.a, {
                          children: Object(T.jsx)(g.a, {
                            variant: "danger",
                            children: te,
                          }),
                        }),
                      Object(T.jsx)(G.a, {
                        children: Object(T.jsx)(_.a.Control, {
                          as: "textarea",
                          rows: 4,
                          value: N,
                          onChange: function (e) {
                            return Q(e.target.value);
                          },
                        }),
                      }),
                      "BREAK_A_LEG" === L &&
                        Object(T.jsxs)(G.a, {
                          children: [
                            Object(T.jsx)(x.a, {
                              children: Object(T.jsx)(_.a.Check, {
                                type: "checkbox",
                                label: "Break A Leg",
                                checked: Ee,
                                disabled: !Ze(),
                                onChange: function () {
                                  Ye(!Ee);
                                },
                              }),
                            }),
                            Object(T.jsx)(x.a, {
                              children: Object(T.jsx)(_.a.Control, {
                                type: "number",
                                min: 0,
                                max: t.figure.vertices.length - 1,
                                value: de,
                                onChange: function (e) {
                                  return (
                                    (t = parseInt(e.target.value)),
                                    void (Ee || he(t))
                                  );
                                  var t;
                                },
                              }),
                            }),
                            Object(T.jsx)(x.a, {
                              children: Object(T.jsx)(_.a.Control, {
                                type: "number",
                                min: 0,
                                max: t.figure.vertices.length - 1,
                                value: Be,
                                onChange: function (e) {
                                  return (
                                    (t = parseInt(e.target.value)),
                                    void (Ee || ve(t))
                                  );
                                  var t;
                                },
                              }),
                            }),
                          ],
                        }),
                      "WALLHACK" === L &&
                        Object(T.jsx)(x.a, {
                          children: Object(T.jsx)(_.a.Check, {
                            type: "checkbox",
                            label: "WallHack",
                            checked: Ce,
                            onChange: function () {
                              Ce ? (qe(), Te(!1)) : (Qe("WALLHACK"), Te(!0));
                            },
                          }),
                        }),
                      "SUPERFLEX" === L &&
                        Object(T.jsx)(x.a, {
                          children: Object(T.jsx)(_.a.Check, {
                            type: "checkbox",
                            label: "SuperFlex",
                            checked: Ue,
                            onChange: function () {
                              Ue ? (qe(), We(!1)) : (Qe("SUPERFLEX"), We(!0));
                            },
                          }),
                        }),
                      "GLOBALIST" === L &&
                        Object(T.jsx)(x.a, {
                          children: Object(T.jsx)(_.a.Check, {
                            type: "checkbox",
                            label: "Globalist",
                            checked: He,
                            onChange: function () {
                              He ? (qe(), Me(!1)) : (Qe("GLOBALIST"), Me(!0));
                            },
                          }),
                        }),
                      Object(T.jsxs)(G.a, {
                        children: [
                          Object(T.jsx)(x.a, {
                            children: Object(T.jsxs)(G.a, {
                              children: [
                                Object(T.jsx)(R.a, {
                                  onClick: function () {
                                    return De("L");
                                  },
                                  children: "L",
                                }),
                                Object(T.jsxs)("div", {
                                  children: [
                                    Object(T.jsx)("div", {
                                      children: Object(T.jsx)(R.a, {
                                        onClick: function () {
                                          return De("U");
                                        },
                                        children: "U",
                                      }),
                                    }),
                                    Object(T.jsx)("div", {
                                      children: Object(T.jsx)(R.a, {
                                        onClick: function () {
                                          return De("D");
                                        },
                                        children: "D",
                                      }),
                                    }),
                                  ],
                                }),
                                Object(T.jsx)(R.a, {
                                  onClick: function () {
                                    return De("R");
                                  },
                                  children: "R",
                                }),
                              ],
                            }),
                          }),
                          Object(T.jsx)(x.a, {
                            children: Object(T.jsx)(G.a, {
                              children: Object(T.jsx)(_.a.Control, {
                                type: "number",
                                value: ie,
                                onChange: function (e) {
                                  return se(parseInt(e.target.value));
                                },
                              }),
                            }),
                          }),
                        ],
                      }),
                      Object(T.jsx)(G.a, {
                        children: Object(T.jsxs)("div", {
                          children: [
                            Object(T.jsxs)(_.a.Check, {
                              inline: !0,
                              children: [
                                Object(T.jsx)(_.a.Check.Input, {
                                  type: "checkbox",
                                  onChange: function () {
                                    return Ve();
                                  },
                                  checked: Je(),
                                }),
                                Object(T.jsx)(_.a.Check.Label, {
                                  onChange: function () {
                                    return Ve();
                                  },
                                  children: "All",
                                }),
                              ],
                            }),
                            Object(T.jsx)(_.a, {
                              children: y.vertices.map(function (e, t) {
                                return Object(T.jsxs)(
                                  _.a.Check,
                                  {
                                    inline: !0,
                                    children: [
                                      Object(T.jsx)(_.a.Check.Input, {
                                        type: "checkbox",
                                        onChange: function () {
                                          return Ne(t);
                                        },
                                        checked: oe.includes(t),
                                      }),
                                      Object(T.jsx)(_.a.Check.Label, {
                                        onClick: function () {
                                          return Ne(t);
                                        },
                                        children: t,
                                      }),
                                    ],
                                  },
                                  t
                                );
                              }),
                            }),
                          ],
                        }),
                      }),
                      Object(T.jsxs)(G.a, {
                        children: [
                          Object(T.jsx)(x.a, {
                            children: Object(T.jsx)(w, {
                              problem: t,
                              userFigure: $e,
                              selectedVertices: oe,
                              onSolve: function (e) {
                                P(
                                  Object(A.a)(
                                    Object(A.a)({}, y),
                                    {},
                                    {
                                      vertices: Object(l.a)(e),
                                    }
                                  )
                                );
                              },
                            }),
                          }),
                          Object(T.jsx)(x.a, {
                            children: Object(T.jsx)(R.a, {
                              onClick: function () {
                                var e = (function (e) {
                                  var t = e[0][0],
                                    n = e[0][1];
                                  e.forEach(function (e) {
                                    var r = Object(O.a)(e, 2),
                                      c = r[0],
                                      i = r[1];
                                    (t = Math.min(t, c)), (n = Math.min(n, i));
                                  });
                                  var r = e
                                      .map(function (e) {
                                        var r = Object(O.a)(e, 2),
                                          c = r[0],
                                          i = r[1];
                                        return [c - t, i - n];
                                      })
                                      .map(function (e) {
                                        var t = Object(O.a)(e, 2),
                                          n = t[0];
                                        return [-t[1], n];
                                      }),
                                    c = r[0][0],
                                    i = r[0][1];
                                  return (
                                    r.forEach(function (e) {
                                      var t = Object(O.a)(e, 2),
                                        n = t[0],
                                        r = t[1];
                                      (c = Math.min(c, n)),
                                        (i = Math.min(i, r));
                                    }),
                                    r.map(function (e) {
                                      var r = Object(O.a)(e, 2),
                                        s = r[0],
                                        a = r[1];
                                      return [s - c + t, a - i + n];
                                    })
                                  );
                                })($e.vertices);
                                P(
                                  Object(A.a)(
                                    Object(A.a)({}, y),
                                    {},
                                    {
                                      vertices: Object(l.a)(e),
                                    }
                                  )
                                );
                              },
                              children: "R90",
                            }),
                          }),
                        ],
                      }),
                    ],
                  }),
                  Object(T.jsx)(x.a, {
                    className: "ml-3",
                    children: Object(T.jsx)(G.a, {
                      children: Object(T.jsx)(H, {
                        isWallHacking: Ce,
                        userFigure: $e,
                        problem: t,
                        usingGlobalist: "GLOBALIST" === L,
                      }),
                    }),
                  }),
                ],
              }),
            ],
          });
        },
        $ = function () {
          var e = Object(o.g)().problemId,
            t = (function (e) {
              var t = "".concat(J, "/").concat(e, ".json");
              return V(t, function (e) {
                return fetch(e)
                  .then(function (e) {
                    return e.json();
                  })
                  .then(function (e) {
                    return e;
                  });
              });
            })(e);
          return t.error
            ? (console.error(t.error),
              Object(T.jsx)(g.a, {
                variant: "danger",
                children: t.error,
              }))
            : t.data
            ? Object(T.jsx)(v.a, {
                children: Object(T.jsx)(Q, {
                  problem: t.data,
                  problemId: parseInt(e),
                }),
              })
            : Object(T.jsx)(K.a, {
                animation: "border",
                role: "status",
                children: Object(T.jsx)("span", {
                  className: "sr-only",
                  children: "Loading...",
                }),
              });
        },
        ee = function () {
          for (var e = Object(o.e)(), t = [], n = 1; n <= 59; n++)
            t.push(n + "");
          var c = Object(r.useState)(t[0]),
            i = Object(O.a)(c, 2),
            s = i[0],
            a = i[1];
          return Object(T.jsx)(v.a, {
            children: Object(T.jsxs)(_.a, {
              children: [
                Object(T.jsx)(_.a.Label, {
                  children: "Problem:",
                }),
                Object(T.jsx)(_.a.Control, {
                  as: "select",
                  onChange: function (e) {
                    return a(e.target.value);
                  },
                  children: t.map(function (e) {
                    return Object(T.jsx)(
                      "option",
                      {
                        children: e,
                      },
                      e
                    );
                  }),
                }),
                Object(T.jsx)(R.a, {
                  onClick: function () {
                    e.push({
                      pathname: "/problem/".concat(s),
                    });
                  },
                  children: "Go",
                }),
              ],
            }),
          });
        },
        te = function () {
          return Object(T.jsxs)(L.a, {
            children: [
              Object(T.jsx)(a.a, {
                bg: "light",
                expand: "lg",
                children: Object(T.jsx)(a.a.Brand, {
                  href: "/",
                  children: "ICFPC2021",
                }),
              }),
              Object(T.jsxs)(u.a, {
                children: [
                  Object(T.jsx)(o.a, {
                    path: "/problem/:problemId",
                    children: Object(T.jsx)($, {}),
                  }),
                  Object(T.jsx)(o.a, {
                    exact: !0,
                    path: "/",
                    children: Object(T.jsx)(ee, {}),
                  }),
                ],
              }),
            ],
          });
        };
      n(64);
      s.a.render(
        Object(T.jsx)(c.a.StrictMode, {
          children: Object(T.jsx)(te, {}),
        }),
        document.getElementById("root")
      );
    },
  },
  [[65, 2, 3]],
]);
//# sourceMappingURL=main.23c2491b.chunk.js.map
