import { BadRequestException, Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { User } from './entities/user.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { LoginUserDto, CreateUserDto } from './dto';
import { JwtPayload } from './interfaces/jwt-payload.interfaces';
import { JwtService } from '@nestjs/jwt';


@Injectable()
export class AuthService {

    private readonly logger = new Logger('AuthService');

    constructor(
      @InjectRepository(User)
      private readonly userRepository: Repository<User>,

      private readonly jwtService: JwtService,
    ){}
  

  async create(createUserDto: CreateUserDto) {
    try{

      const { password, ...userDetails } = createUserDto;
      const user = this.userRepository.create({
        ...userDetails,
        password: bcrypt.hashSync( password, 10 )
      });

      await this.userRepository.save( user );


    return {
      ...user,
      token: this.getJwtToken({id: user.id})
    }

    }catch(error){
      this.handleDBError(error);
    }
  }

  async login(loginUserDto: LoginUserDto) {
    
    const { email, password } = loginUserDto;
    const user = await this.userRepository.findOne({
      where: {email},
      select: { email: true, password: true, id: true}
     });

    if ( !user )
      throw new BadRequestException('Credentials are not valid (email)');

    if ( !bcrypt.compareSync( password, user.password ) )
      throw new BadRequestException('Credentials are not valid (password)');

    return {
      ...user,
      token: this.getJwtToken({id: user.id})
    }
    
  }

  async checkAuthStatus(user: User){

    return {
      ...user,
      token: this.getJwtToken({id: user.id})
    }

  }




  private getJwtToken(payload: JwtPayload ){

    const token = this.jwtService.sign(payload)
    return token;

  }

  private handleDBError( error: any ) {
  
      if ( error.code === '23505' )
        throw new BadRequestException(error.detail);
      
      this.logger.error(error)
      // console.log(error)
      throw new InternalServerErrorException('Unexpected error, check server logs');
  
    }


}

