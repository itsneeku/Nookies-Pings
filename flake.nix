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
            bun
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
        };
      }
    );
}
