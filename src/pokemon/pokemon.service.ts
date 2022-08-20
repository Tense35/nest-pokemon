import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { isValidObjectId, Model } from 'mongoose';

import { CreatePokemonDto } from './dto/create-pokemon.dto';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { Pokemon } from './entities/pokemon.entity';
import { UpdatePokemonDto } from './dto/update-pokemon.dto';

@Injectable()
export class PokemonService {

  private defaultLimit: number;

  constructor(
    @InjectModel(Pokemon.name)
    private readonly pokemonModel: Model<Pokemon>,
    private readonly configService: ConfigService
  ){
    this.defaultLimit = configService.get<number>('defaultLimit');
  }

  public async create(createPokemonDto: CreatePokemonDto) {
    createPokemonDto.name = createPokemonDto.name.toLowerCase();

    try {
      return await this.pokemonModel.create(createPokemonDto);
    } catch(error) {
      this.handleExceptions(error);
    }

    
  }

  findAll(paginationDto: PaginationDto) {

    const { limit = this.defaultLimit, offset = 0 } = paginationDto;

    return this.pokemonModel.find()
    .limit(limit)
    .skip(offset)
    .sort({
      no: 1
    })
    .select('-__v');
  }

  public async findOne(term: string) {
    let pokemon: Pokemon = null;

    if (!isNaN(+term)) {
      pokemon = await this.pokemonModel.findOne({ no: term });
    }

    if (!pokemon && isValidObjectId(term)) {
      pokemon = await this.pokemonModel.findById(term);
    }

    if ( !pokemon ) {
      pokemon = await this.pokemonModel.findOne({ name: term.toLowerCase().trim() });
    }

    if (!pokemon) throw new NotFoundException(`Pokemon with id, name or no '${term}' not found`);
    
    return pokemon;
  }

  public async update(term: string, updatePokemonDto: UpdatePokemonDto) {

    try {
      const pokemon = await this.findOne(term);
      if (updatePokemonDto.name) updatePokemonDto.name = updatePokemonDto.name.toLowerCase();
      await pokemon.updateOne(updatePokemonDto, { new: true });
  
      return { ...pokemon.toJSON(), ...updatePokemonDto };
    } catch(error) {
      this.handleExceptions(error);
    }

  }

  public async remove(id: string) {
    const { deletedCount } = await this.pokemonModel.deleteOne({ _id: id });

    if (deletedCount === 0) throw new NotFoundException(`Pokemon with id ${id} not found`);
  }

  public async removeAll() {
    await this.pokemonModel.deleteMany({});
  }

  public async createMany(pokemones: CreatePokemonDto[]) {
    await this.pokemonModel.insertMany(pokemones);
  }

  private handleExceptions(error: any) {
    if (error.code === 11000) 
      throw new BadRequestException(`Pokemon exists in db ${ JSON.stringify(error.keyValue) }`);
    console.log(error);
    throw new InternalServerErrorException(`Can't create pokemon - check server logs`);
  }
}
