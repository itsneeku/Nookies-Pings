{
  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs/nixos-unstable";
    utils.url = "github:numtide/flake-utils";
  };

  outputs =
    { nixpkgs, utils, ... }:
    utils.lib.eachDefaultSystem (
      system:
      let
        pkgs = nixpkgs.legacyPackages.${system};
      in
      {
        devShells.default = pkgs.mkShell {
          packages = with pkgs; [
            deno
            uv
            valkey
          ];
        };

        apps = {
          db = utils.lib.mkApp {
            drv = pkgs.writeShellScriptBin "start-db" ''
              exec ${pkgs.valkey}/bin/valkey-server
            '';
          };

          ui = utils.lib.mkApp {
            drv = pkgs.writeShellScriptBin "start-ui" ''
              exec ${pkgs.deno}/bin/deno run --allow-all --watch src/ui.ts
            '';
          };

          main = utils.lib.mkApp {
            drv = pkgs.writeShellScriptBin "start-main" ''
              exec ${pkgs.deno}/bin/deno run --allow-all --watch src/main.ts
            '';
          };

          worker = utils.lib.mkApp {
            drv = pkgs.writeShellScriptBin "start-worker" ''
              exec ${pkgs.deno}/bin/deno run --allow-all --watch src/worker.ts
            '';
          };

        };
      }
    );
}
