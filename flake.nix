{
  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs/nixos-unstable";
    utils.url = "github:numtide/flake-utils";
    ndppd.url = "github:Red54/nixpkgs/ndppd-0.2.6";
  };

  outputs =
    {
      self,
      nixpkgs,
      utils,
      ndppd,
    }:
    utils.lib.eachDefaultSystem (
      system:
      let
        pkgs = nixpkgs.legacyPackages.${system};
      in
      {
        devShells.default = pkgs.mkShell {
          packages =
            with pkgs;
            [
              bun
              uv
              nodejs_latest
            ]
            ++ [ ndppd.legacyPackages.${system}.ndppd ];
        };
      }
    );
}
